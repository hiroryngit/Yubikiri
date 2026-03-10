-- ip_city は不正確なので ip_region（都道府県）に変更
ALTER TABLE agreement_logs RENAME COLUMN ip_city TO ip_region;
