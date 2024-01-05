/*
  Warnings:

  - A unique constraint covering the columns `[roomName]` on the table `Game` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Game_roomName_key" ON "Game"("roomName");
