"use client";

/**
 * useNeuralAgent
 * ──────────────
 * Wraps @codeswayam/neural's useNeuralChat with subscription + points awareness.
 *
 * Rules:
 *  - If user has an active NeuralHub subscription → AI calls are free (no point deduction)
 *  - Otherwise → each call deducts points via core-api /credits/use
 *  - If insufficient points → throws with a clear message
 */

import { useCallback } from "react";
import { useNeuralChat, type UseNeuralChatOptions } from "@codeswayam/neural/react";
import { useCSWSubscriptions, useCSWCredits } from "@codeswayam/auth";
import { useCredits } from "@codeswayam/api-client";

const NEURAL_SAAS_ID = "neural";
const AI_CHAT_FEATURE_KEY = "ai_chat";
const AI_CHAT_POINT_COST = 10; // points per neural AI call when not on paid plan

export interface UseNeuralAgentOptions extends UseNeuralChatOptions {
  /** Skip point deduction even if not subscribed (e.g. admin/internal use) */
  skipBilling?: boolean;
}

export function useNeuralAgent(options: UseNeuralAgentOptions) {
  const { subscriptions } = useCSWSubscriptions();
  const { balance, refresh: refreshCredits } = useCSWCredits();

  // Check if user has an active neural subscription (any plan)
  const hasNeuralSub = subscriptions.some(
    (s) =>
      s.status === "active" &&
      (s.productSaasId?.includes("neural") ||
        (s as any).productFamily === "neural" ||
        s.planType === "BUNDLE")
  );

  const chat = useNeuralChat(options);

  const sendMessage = useCallback(
    async (content: string) => {
      // If not subscribed and not skipping billing, check + deduct points
      if (!hasNeuralSub && !options.skipBilling) {
        if (balance < AI_CHAT_POINT_COST) {
          throw new Error(
            `Insufficient credits. You need ${AI_CHAT_POINT_COST} pts for an AI call. Current balance: ${balance} pts. Buy credits or upgrade your plan.`
          );
        }

        // Deduct points BEFORE the call (optimistic deduction)
        try {
          await useCredits({
            saasId: NEURAL_SAAS_ID,
            featureKey: AI_CHAT_FEATURE_KEY,
            quantity: 1,
            metadata: { agentId: options.agentId },
          });
          refreshCredits();
        } catch (err: any) {
          throw new Error(
            err?.message?.includes("INSUFFICIENT")
              ? `Not enough credits for AI call. Buy more points to continue.`
              : `Credit deduction failed: ${err.message}`
          );
        }
      }

      return chat.sendMessage(content);
    },
    [chat, hasNeuralSub, balance, options.skipBilling, options.agentId, refreshCredits]
  );

  return {
    ...chat,
    sendMessage,
    /** Whether AI calls are free for this user */
    aiIncluded: hasNeuralSub,
    /** Cost per call in points (0 if aiIncluded) */
    callCost: hasNeuralSub ? 0 : AI_CHAT_POINT_COST,
    /** Current credit balance */
    creditBalance: balance,
    /** Whether user can afford one AI call */
    canAfford: hasNeuralSub || balance >= AI_CHAT_POINT_COST,
  };
}
