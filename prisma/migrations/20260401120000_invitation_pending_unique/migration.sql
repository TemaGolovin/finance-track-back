DROP INDEX IF EXISTS "Invitation_recipientId_groupId_key";

CREATE UNIQUE INDEX "Invitation_recipientId_groupId_pending_key"
ON "Invitation"("recipientId", "groupId")
WHERE "status" = 'PENDING';
