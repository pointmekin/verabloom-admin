# Verabloom

Verabloom manages custom flower orders, payments, and material expenses.

## Current order-entry model

The admin records each custom order directly. The application has no catalog or
saved-customer workflow. Each order records a LINE name, flower type and size,
request details, messenger or postal delivery, a required date, an optional
delivery address, an optional phone number, and an exact Thai baht value.

**Flower type and size**:
The admin-authored plain-text description of the custom bouquet type and size.
The order stores this value in the historical product snapshot field.
_Avoid_: Product selection, catalog item

## Language

**Product**:
A bouquet design displayed in the public catalog. A product may have one or more variations.
_Avoid_: Catalog item, bouquet style

**Starting price**:
The indicative price shown for a product before the shop confirms an order's final price.
_Avoid_: Fixed price, final price, variation price

**Order request**:
Details submitted by a customer for the shop to review. It does not commit the shop to the requested design, price, or delivery date.
_Avoid_: Order, booking

**Request reference**:
The human-readable identifier used to find and discuss an order request or order, formatted as `VB-` followed by a number.
_Avoid_: Authentication code, database ID

**Order**:
An order request that the shop has accepted with an agreed final price and fulfillment details.
_Avoid_: Order request, sale

**Order status**:
The order's current stage: pending review, confirmed, work in progress, completed, or cancelled.
_Avoid_: Production stage, shipping status

**Task owner**:
One or more team members who make the flowers for an order. Every order an admin saves has at least one. A customer's own request starts with no owner.
_Avoid_: Assignee, staff role, admin account

**Request details**:
The customer's plain-text description of colors, flowers, wrapping, card text, or other preferences for an order request.
_Avoid_: Product description, structured customization

**Selected product details**:
The product name copied into an order request when submitted. Later catalog changes do not alter these details. The customer describes the size and style in the request details.
_Avoid_: Live catalog details

**Internal note**:
An optional shop-only note attached to an order request or order.
_Avoid_: Request details, customer message

**Required date**:
The date by which the customer needs an order ready or dispatched, shown to customers as "ส่งภายในวันที่".
_Avoid_: Delivery guarantee, delivery time slot

**Delivery method**:
How the customer will receive an order: postal delivery, messenger, or collection. Each method has its own color and icon.
_Avoid_: Shipping provider, fulfillment status

**Order recipient**:
The person who receives a delivered order. A postal order records the recipient name, phone, and address as separate required fields. A messenger order records all recipient information in one free-text block.
_Avoid_: Customer, default address

**Customer**:
The person who requests and purchases a bouquet.
_Avoid_: Client, buyer, account

**Default address**:
An optional delivery address saved for a customer and offered when an admin creates an order.
_Avoid_: Order address

**Order address**:
The delivery address recorded on an individual postal or messenger order. It does not change when the customer's default address changes.
_Avoid_: Default address, live customer address

**Payment**:
Money received from a customer for an order. An order may have multiple payments.
_Avoid_: Income, order value

**Order value**:
The final price agreed when the shop confirms an order, including any delivery cost.
_Avoid_: Starting price, payment, income

**Outstanding amount**:
The part of an order's final price not yet covered by its payments.
_Avoid_: Expense, loss

**Received income**:
The sum of recorded customer payments, including payments retained for cancelled orders.
_Avoid_: Order value, expected income

**Net cash**:
Received income minus recorded expenses.
_Avoid_: Profit, outstanding amount

**Reporting period**:
An inclusive start and end date used to summarize received income, expenses, and net cash.
_Avoid_: Accounting period, saved report

**Expense**:
Money a team member paid for shop materials or another shop cost.
_Avoid_: Payment, reimbursement

**Payout**:
Money transferred from the central account to a team member. It records a completed transfer and is not a shop expense.
_Avoid_: Expense, payment, reimbursement

**Central account**:
The account owned by Meen that receives recorded payments and sends payouts.
_Avoid_: Expense account, payout recipient

**Central account balance**:
Received income minus payouts for the selected reporting period or all time. Expenses remain separate because they are paid by team members, not from the central account.
_Avoid_: Net cash, profit

**Team member**:
One of Chompooh, Meen, or Kan. A team member pays an expense and owns an order's flower work. Each one has an accent color used across the interface.
_Avoid_: Admin, user, staff role
