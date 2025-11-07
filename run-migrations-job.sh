#!/bin/bash
export DATABASE_URL="postgresql://qivo_user:n2xO8X74FCqICTTz8kAFNVxpc7PvZ3WxhOTsdSDwTv0=@10.66.0.2:5432/qivo_mining_prod?sslmode=require"
pnpm run migrate
