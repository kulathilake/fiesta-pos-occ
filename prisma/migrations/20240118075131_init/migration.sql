-- AlterTable
ALTER TABLE `kitchenticket` MODIFY `status` ENUM('RECIEVED', 'TO_KITCHEN', 'PREPARING', 'DISPATCHED') NOT NULL DEFAULT 'RECIEVED';