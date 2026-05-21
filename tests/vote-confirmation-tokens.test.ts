import { deepEqual, equal } from "node:assert/strict";
import { test } from "node:test";
import {
  createVoteConfirmationToken,
  readVoteConfirmationToken,
  hashVoteConfirmationToken,
} from "../src/lib/vote-confirmation-tokens";

test("vote confirmation tokens round-trip with normalized email and selected video/device", () => {
  process.env.VOTE_SECURITY_SECRET = "test-secret-for-votes-123456";

  const token = createVoteConfirmationToken({
    email: "USER@Example.COM ",
    videoId: "pizza-day",
    deviceId: "a".repeat(64),
  });

  const payload = readVoteConfirmationToken(token);

  deepEqual(payload, {
    email: "user@example.com",
    videoId: "pizza-day",
    deviceId: "a".repeat(64),
  });
  equal(hashVoteConfirmationToken(token).length, 64);
});

test("vote confirmation tokens reject tampering", () => {
  process.env.VOTE_SECURITY_SECRET = "test-secret-for-votes-123456";

  const token = createVoteConfirmationToken({
    email: "user@example.com",
    videoId: "pizza-day",
    deviceId: "b".repeat(64),
  });

  equal(readVoteConfirmationToken(`${token}x`), null);

  const parts = token.split(".");
  parts[4] = Buffer.from("other-song").toString("base64url");
  equal(readVoteConfirmationToken(parts.join(".")), null);
});
