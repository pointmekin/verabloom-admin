# Verabloom

Verabloom manages the shop's bouquet catalog, customer orders, payments, and material expenses.

## Language

**Product**:
A bouquet design displayed in the public catalog. A product may have one or more variations.
_Avoid_: Catalog item, bouquet style

**Variation**:
A purchasable option belonging to a product, such as a size or construction style. Each product has only the variations that apply to it.
_Avoid_: Product type, universal size

**Starting price**:
The indicative price shown for a variation before the shop confirms an order's final price.
_Avoid_: Fixed price, final price

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
The order's current stage: pending review, confirmed, completed, or cancelled.
_Avoid_: Production stage, shipping status

**Request details**:
The customer's plain-text description of colors, flowers, wrapping, card text, or other preferences for an order request.
_Avoid_: Product description, structured customization

**Selected product details**:
The product name, variation name, and starting price copied into an order request when submitted. Later catalog changes do not alter these details.
_Avoid_: Live catalog details

**Internal note**:
An optional shop-only note attached to an order request or order.
_Avoid_: Request details, customer message

**Required date**:
The date by which the customer needs an order ready or dispatched, shown to customers as "ส่งภายในวันที่".
_Avoid_: Delivery guarantee, delivery time slot

**Delivery method**:
How the customer will receive an order: postal delivery, messenger, or collection.
_Avoid_: Shipping provider, fulfillment status

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

**Team member**:
One of Chompooh, Meen, or Kan, identified as the person who paid an expense.
_Avoid_: Admin, user
