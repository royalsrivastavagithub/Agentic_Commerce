# Database Schema

```mermaid
erDiagram
    categories ||--o{ products : has
    categories {
        integer id PK
        string name unique
    }
    users {
        integer id PK
        string email unique
        string hashed_password
        boolean is_active nullable
        boolean is_verified nullable
        string verification_token nullable
        string role
    }
    products {
        integer id PK
        string title
        string description
        integer category_id FK
        float price
        float discountPercentage
        float rating
        integer stock
        json tags
        string brand nullable
        string sku
        float weight
        json dimensions
        string warrantyInformation
        string shippingInformation
        string availabilityStatus
        json reviews
        string returnPolicy
        integer minimumOrderQuantity
        json meta
        json images
        string thumbnail
    }
```
