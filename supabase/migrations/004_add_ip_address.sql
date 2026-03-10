-- agreement_logs に IP アドレスとアクセス元地域を追加
ALTER TABLE agreement_logs ADD COLUMN ip_address text;
ALTER TABLE agreement_logs ADD COLUMN ip_country text;
ALTER TABLE agreement_logs ADD COLUMN ip_city text;
