
### Payments API

本项目提供支付相关接口，基于 NOWPayments 创建订单，并在回调后为用户增加积分（credits）。所有接口均需用户认证（Bearer JWT）。

#### 1) 创建支付订单

- Method: POST
- Path: /api/v1/payments/create
- Auth: 必需（Authorization: Bearer <JWT>）
- Headers:
  - Content-Type: application/json
  - Authorization: Bearer <JWT>
- Request Body:
  - amount_usd (float) 必填：当前支持的套餐为 3/10/50/100/200（单位 USD），服务端会根据套餐映射对应 credits
  - pay_currency (string) 必填：支付币种，例如 sol、btc、eth、usdttrc20 等
  - order_description (string) 可选：订单描述
  - ipn_callback_url (string) 可选：覆盖默认的 IPN 回调地址（用于本地或隧道联调）

- 成功响应（200）:
  - payment_id
  - pay_address
  - pay_amount
  - pay_currency
  - price_amount
  - price_currency
  - order_id

- 示例请求（curl）：
```bash
curl -X POST 'http://localhost:8000/api/v1/payments/create' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "amount_usd": 3,
    "pay_currency": "sol",
    "order_description": "Top up 3 USD",
    "ipn_callback_url": "https://9dbd92dd9f61.ngrok-free.app/api/v1/payments/ipn"
  }'
```

- 示例成功响应：
```json
{
  "payment_id": 6200340354,
  "pay_address": "6nXREMUPfQBNKAqLNPzudxK9jDmu85jjy55spQrhmhTW",
  "pay_amount": 0.01474431,
  "pay_currency": "sol",
  "price_amount": 3.0,
  "price_currency": "usd",
  "order_id": "9778bcf5-1735-4534-bd94-d9656d1cba47:3.0:150:2c1aab11"
}
```

- 失败响应：
  - 400 Unsupported package amount（套餐不受支持）
  - 502 Create payment failed: ... 或包含 provider_error 的错误体（NOWPayments 返回的错误向前端透传）

注意：
- 服务端会将当前用户、套餐对应的 credits 与订单信息写入数据库，并在 Redis 中临时保存映射（用于回调阶段快速还原）；即使 Redis 不可用，数据库仍会完整记录并保障幂等。

#### 2) 查询支付/购买记录

- Method: GET
- Path: /api/v1/payments/records
- Auth: 必需（Authorization: Bearer <JWT>）
- Query 参数：
  - limit (int) 可选，默认 50，范围 1-200

- 成功响应（200）：返回 PaymentRecord 列表（按创建时间倒序），字段包含：
  - payment_id, order_id, purchase_id
  - amount_usd, credits
  - price_amount, price_currency
  - pay_amount, pay_currency, pay_address
  - payment_status
  - processed（是否已为用户加点）
  - created_at, updated_at
  - ipn_payload（NOWPayments IPN 原始载荷，JSON）

- 示例请求（curl）：
```bash
curl -X GET 'http://localhost:8000/api/v1/payments/records?limit=100' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Accept: application/json'
```

- 示例成功响应（示例）：
```json
[{"payment_id":6200340354,"order_id":"9778bcf5-1735-4534-bd94-d9656d1cba47:3.0:150:2c1aab11","purchase_id":"4988757009","amount_usd":null,"credits":150,"price_amount":3.0,"price_currency":"usd","pay_amount":0.01474431,"pay_currency":"sol","pay_address":"6nXREMUPfQBNKAqLNPzudxK9jDmu85jjy55spQrhmhTW","payment_status":"finished","processed":true,"created_at":"2025-09-08T02:12:08.080782Z","updated_at":"2025-09-08T02:12:09.377256Z","ipn_payload":{"fee":{"currency":"sol","depositFee":0.000644,"serviceFee":7.1e-05,"withdrawalFee":0},"order_id":"9778bcf5-1735-4534-bd94-d9656d1cba47:3.0:150:2c1aab11","invoice_id":null,"pay_amount":0.01474431,"payment_id":6200340354,"pay_address":"6nXREMUPfQBNKAqLNPzudxK9jDmu85jjy55spQrhmhTW","purchase_id":"4988757009","pay_currency":"sol","price_amount":3,"actually_paid":0.01474431,"outcome_amount":0.0140303,"payin_extra_id":null,"payment_status":"finished","price_currency":"usd","outcome_currency":"sol","order_description":"Test 3 U","parent_payment_id":null,"payment_extra_ids":null,"actually_paid_at_fiat":0}},{"payment_id":4984454136,"order_id":"9778bcf5-1735-4534-bd94-d9656d1cba47:1.5:75:93e08bae","purchase_id":"4944839511","amount_usd":null,"credits":75,"price_amount":1.5,"price_currency":"usd","pay_amount":0.00737393,"pay_currency":"sol","pay_address":"FUTtMudMxN8gyt58GVuLzg2L9drHz6MyHHs3TgZUQiwd","payment_status":"finished","processed":true,"created_at":"2025-09-08T02:02:12.322586Z","updated_at":"2025-09-08T02:02:13.851177Z","ipn_payload":{"fee":{"currency":"sol","depositFee":0.000644,"serviceFee":3.4e-05,"withdrawalFee":0},"order_id":"9778bcf5-1735-4534-bd94-d9656d1cba47:1.5:75:93e08bae","invoice_id":null,"pay_amount":0.00737393,"payment_id":4984454136,"pay_address":"FUTtMudMxN8gyt58GVuLzg2L9drHz6MyHHs3TgZUQiwd","purchase_id":"4944839511","pay_currency":"sol","price_amount":1.5,"actually_paid":0.00737393,"outcome_amount":0.00669677,"payin_extra_id":null,"payment_status":"finished","price_currency":"usd","outcome_currency":"sol","order_description":"Test 1.5 U","parent_payment_id":null,"payment_extra_ids":null,"actually_paid_at_fiat":0}}]
```

提示：
- 响应中的 credits 为服务端根据套餐映射计算（当前为 3→150, 10→550, 50→2900, 100→6200, 200→13000）。历史记录可能包含旧套餐（如 1.5→75）。
- ipn_payload 保留了 NOWPayments 的完整回调载荷，便于审计与排障。
