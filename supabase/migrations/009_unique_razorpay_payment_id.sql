-- Unique Razorpay payment IDs prevent duplicate paid orders from the same capture.
create unique index if not exists orders_razorpay_payment_id_uidx
  on public.orders (razorpay_payment_id)
  where razorpay_payment_id is not null and razorpay_payment_id <> '';
