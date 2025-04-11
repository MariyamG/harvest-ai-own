# API Documentation

This document provides details about the API endpoints available in the Coffee Shop AI Optimization App.

## Backend API Endpoints

### Authentication

#### `POST /api/auth/login`
Authenticates a user and returns a session token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name"
  },
  "session": "session-token"
}
```

#### `POST /api/auth/register`
Registers a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name"
  },
  "session": "session-token"
}
```

### User Profile

#### `GET /api/user/profile`
Gets the user's profile information.

**Headers:**
- `Authorization: Bearer <session-token>`

**Response:**
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "name": "User Name",
  "shop_name": "Coffee Shop",
  "location": "New York, NY",
  "shop_hours": [6, 22]
}
```

#### `PUT /api/user/profile`
Updates the user's profile information.

**Headers:**
- `Authorization: Bearer <session-token>`

**Request Body:**
```json
{
  "name": "Updated Name",
  "shop_name": "Updated Coffee Shop",
  "location": "San Francisco, CA",
  "shop_hours": [7, 21]
}
```

**Response:**
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "name": "Updated Name",
  "shop_name": "Updated Coffee Shop",
  "location": "San Francisco, CA",
  "shop_hours": [7, 21]
}
```

### Sales

#### `GET /api/sales`
Gets sales data for the user.

**Headers:**
- `Authorization: Bearer <session-token>`

**Query Parameters:**
- `startDate` (optional): Start date for filtering sales (ISO format)
- `endDate` (optional): End date for filtering sales (ISO format)
- `limit` (optional): Maximum number of sales to return (default: 100)

**Response:**
```json
[
  {
    "id": "sale-id",
    "timestamp": "2025-04-11T10:30:00Z",
    "item_name": "Latte",
    "amount": 4.50,
    "quantity": 1,
    "category": "beverage"
  },
  {
    "id": "sale-id-2",
    "timestamp": "2025-04-11T10:35:00Z",
    "item_name": "Muffin",
    "amount": 3.25,
    "quantity": 1,
    "category": "food"
  }
]
```

#### `POST /api/sales`
Adds a new sale.

**Headers:**
- `Authorization: Bearer <session-token>`

**Request Body:**
```json
{
  "timestamp": "2025-04-11T10:30:00Z",
  "item_name": "Latte",
  "amount": 4.50,
  "quantity": 1,
  "category": "beverage"
}
```

**Response:**
```json
{
  "id": "sale-id",
  "timestamp": "2025-04-11T10:30:00Z",
  "item_name": "Latte",
  "amount": 4.50,
  "quantity": 1,
  "category": "beverage",
  "user_id": "user-id"
}
```

### Inventory

#### `GET /api/inventory`
Gets inventory items for the user.

**Headers:**
- `Authorization: Bearer <session-token>`

**Query Parameters:**
- `category` (optional): Filter by category
- `limit` (optional): Maximum number of items to return (default: 100)

**Response:**
```json
[
  {
    "id": "item-id",
    "item_name": "Coffee Beans",
    "quantity": 50,
    "par_level": 100,
    "unit_cost": 12.00,
    "category": "beverage",
    "shelf_life_days": 90
  },
  {
    "id": "item-id-2",
    "item_name": "Milk",
    "quantity": 20,
    "par_level": 40,
    "unit_cost": 4.00,
    "category": "dairy",
    "shelf_life_days": 7
  }
]
```

#### `POST /api/inventory`
Adds a new inventory item.

**Headers:**
- `Authorization: Bearer <session-token>`

**Request Body:**
```json
{
  "item_name": "Coffee Beans",
  "quantity": 50,
  "par_level": 100,
  "unit_cost": 12.00,
  "category": "beverage",
  "shelf_life_days": 90
}
```

**Response:**
```json
{
  "id": "item-id",
  "item_name": "Coffee Beans",
  "quantity": 50,
  "par_level": 100,
  "unit_cost": 12.00,
  "category": "beverage",
  "shelf_life_days": 90,
  "user_id": "user-id"
}
```

#### `PUT /api/inventory/:id`
Updates an inventory item.

**Headers:**
- `Authorization: Bearer <session-token>`

**URL Parameters:**
- `id`: ID of the inventory item to update

**Request Body:**
```json
{
  "quantity": 40,
  "par_level": 80
}
```

**Response:**
```json
{
  "id": "item-id",
  "item_name": "Coffee Beans",
  "quantity": 40,
  "par_level": 80,
  "unit_cost": 12.00,
  "category": "beverage",
  "shelf_life_days": 90,
  "user_id": "user-id"
}
```

### Staff

#### `GET /api/staff`
Gets staff members for the user.

**Headers:**
- `Authorization: Bearer <session-token>`

**Response:**
```json
[
  {
    "id": "staff-id",
    "name": "John Smith",
    "role": "Barista",
    "hourly_rate": 18.00,
    "email": "john@example.com",
    "phone": "555-123-4567"
  },
  {
    "id": "staff-id-2",
    "name": "Jane Doe",
    "role": "Manager",
    "hourly_rate": 25.00,
    "email": "jane@example.com",
    "phone": "555-987-6543"
  }
]
```

#### `POST /api/staff`
Adds a new staff member.

**Headers:**
- `Authorization: Bearer <session-token>`

**Request Body:**
```json
{
  "name": "John Smith",
  "role": "Barista",
  "hourly_rate": 18.00,
  "email": "john@example.com",
  "phone": "555-123-4567"
}
```

**Response:**
```json
{
  "id": "staff-id",
  "name": "John Smith",
  "role": "Barista",
  "hourly_rate": 18.00,
  "email": "john@example.com",
  "phone": "555-123-4567",
  "user_id": "user-id"
}
```

#### `PUT /api/staff/:id`
Updates a staff member.

**Headers:**
- `Authorization: Bearer <session-token>`

**URL Parameters:**
- `id`: ID of the staff member to update

**Request Body:**
```json
{
  "hourly_rate": 20.00,
  "phone": "555-123-4567"
}
```

**Response:**
```json
{
  "id": "staff-id",
  "name": "John Smith",
  "role": "Barista",
  "hourly_rate": 20.00,
  "email": "john@example.com",
  "phone": "555-123-4567",
  "user_id": "user-id"
}
```

### Shifts

#### `GET /api/shifts`
Gets shifts for the user.

**Headers:**
- `Authorization: Bearer <session-token>`

**Query Parameters:**
- `startDate` (optional): Start date for filtering shifts (ISO format)
- `endDate` (optional): End date for filtering shifts (ISO format)
- `staffId` (optional): Filter by staff ID

**Response:**
```json
[
  {
    "id": "shift-id",
    "staff_id": "staff-id",
    "staff": {
      "id": "staff-id",
      "name": "John Smith",
      "role": "Barista"
    },
    "date": "2025-04-11",
    "start_time": "2025-04-11T06:00:00Z",
    "end_time": "2025-04-11T14:00:00Z"
  },
  {
    "id": "shift-id-2",
    "staff_id": "staff-id-2",
    "staff": {
      "id": "staff-id-2",
      "name": "Jane Doe",
      "role": "Manager"
    },
    "date": "2025-04-11",
    "start_time": "2025-04-11T08:00:00Z",
    "end_time": "2025-04-11T16:00:00Z"
  }
]
```

#### `POST /api/shifts`
Adds a new shift.

**Headers:**
- `Authorization: Bearer <session-token>`

**Request Body:**
```json
{
  "staff_id": "staff-id",
  "date": "2025-04-11",
  "start_time": "2025-04-11T06:00:00Z",
  "end_time": "2025-04-11T14:00:00Z"
}
```

**Response:**
```json
{
  "id": "shift-id",
  "staff_id": "staff-id",
  "date": "2025-04-11",
  "start_time": "2025-04-11T06:00:00Z",
  "end_time": "2025-04-11T14:00:00Z"
}
```

#### `PUT /api/shifts/:id`
Updates a shift.

**Headers:**
- `Authorization: Bearer <session-token>`

**URL Parameters:**
- `id`: ID of the shift to update

**Request Body:**
```json
{
  "start_time": "2025-04-11T07:00:00Z",
  "end_time": "2025-04-11T15:00:00Z"
}
```

**Response:**
```json
{
  "id": "shift-id",
  "staff_id": "staff-id",
  "date": "2025-04-11",
  "start_time": "2025-04-11T07:00:00Z",
  "end_time": "2025-04-11T15:00:00Z"
}
```

#### `DELETE /api/shifts/:id`
Deletes a shift.

**Headers:**
- `Authorization: Bearer <session-token>`

**URL Parameters:**
- `id`: ID of the shift to delete

**Response:**
```
204 No Content
```

### Suggestions

#### `GET /api/suggestions`
Gets suggestions for the user.

**Headers:**
- `Authorization: Bearer <session-token>`

**Query Parameters:**
- `implemented` (optional): Filter by implementation status (true/false)
- `category` (optional): Filter by category
- `priority` (optional): Filter by priority
- `limit` (optional): Maximum number of suggestions to return (default: 100)

**Response:**
```json
[
  {
    "id": "suggestion-id",
    "category": "inventory",
    "suggestion": "Restock Coffee Beans soon, current stock is below 20% of par level",
    "priority": "high",
    "details": "{\"item_name\":\"Coffee Beans\",\"current_quantity\":10,\"par_level\":100,\"percent_of_par\":10,\"days_until_stockout\":1}",
    "created_at": "2025-04-11T23:30:00Z",
    "implemented": false
  },
  {
    "id": "suggestion-id-2",
    "category": "staffing",
    "suggestion": "Consider adding staff during 8-9 on Monday, customer wait times increased by 50%",
    "priority": "medium",
    "details": "{\"day_of_week\":1,\"hour\":8,\"transactions\":45,\"staff_count\":2,\"transactions_per_staff\":22.5,\"percent_over_target\":50}",
    "created_at": "2025-04-11T23:30:00Z",
    "implemented": false
  }
]
```

#### `PUT /api/suggestions/:id/implement`
Marks a suggestion as implemented.

**Headers:**
- `Authorization: Bearer <session-token>`

**URL Parameters:**
- `id`: ID of the suggestion to mark as implemented

**Response:**
```json
{
  "id": "suggestion-id",
  "category": "inventory",
  "suggestion": "Restock Coffee Beans soon, current stock is below 20% of par level",
  "priority": "high",
  "details": "{\"item_name\":\"Coffee Beans\",\"current_quantity\":10,\"par_level\":100,\"percent_of_par\":10,\"days_until_stockout\":1}",
  "created_at": "2025-04-11T23:30:00Z",
  "implemented": true
}
```

### Forecasts

#### `GET /api/forecasts`
Gets forecasts for the user.

**Headers:**
- `Authorization: Bearer <session-token>`

**Query Parameters:**
- `startDate` (optional): Start date for filtering forecasts (ISO format)
- `endDate` (optional): End date for filtering forecasts (ISO format)
- `dayOfWeek` (optional): Filter by day of week (0-6, where 0 is Sunday)

**Response:**
```json
[
  {
    "id": "forecast-id",
    "forecast_date": "2025-04-11",
    "forecast_hour": 8,
    "day_of_week": 5,
    "predicted_customers": 35,
    "is_peak": true
  },
  {
    "id": "forecast-id-2",
    "forecast_date": "2025-04-11",
    "forecast_hour": 9,
    "day_of_week": 5,
    "predicted_customers": 30,
    "is_peak": true
  }
]
```

### Clover Integration

#### `GET /api/clover/auth`
Gets the Clover OAuth authorization URL.

**Headers:**
- `Authorization: Bearer <session-token>`

**Response:**
```json
{
  "authUrl": "https://sandbox.dev.clover.com/oauth/authorize?client_id=your_client_id&response_type=code&redirect_uri=your_redirect_uri"
}
```

#### `POST /api/clover/callback`
Handles the Clover OAuth callback.

**Request Body:**
```json
{
  "code": "authorization-code",
  "merchant_id": "merchant-id"
}
```

**Response:**
```json
{
  "access_token": "access-token",
  "merchant_id": "merchant-id",
  "token_type": "Bearer"
}
```

#### `GET /api/clover/sales`
Gets sales data from Clover.

**Headers:**
- `Authorization: Bearer <session-token>`

**Query Parameters:**
- `startDate` (optional): Start date for filtering sales (ISO format)
- `endDate` (optional): End date for filtering sales (ISO format)

**Response:**
```json
[
  {
    "order_id": "order-id",
    "timestamp": "2025-04-11T10:30:00Z",
    "item_name": "Latte",
    "item_id": "item-id",
    "quantity": 1,
    "price": 4.50,
    "amount": 4.50,
    "category": "beverage"
  },
  {
    "order_id": "order-id-2",
    "timestamp": "2025-04-11T10:35:00Z",
    "item_name": "Muffin",
    "item_id": "item-id-2",
    "quantity": 1,
    "price": 3.25,
    "amount": 3.25,
    "category": "food"
  }
]
```

#### `GET /api/clover/inventory`
Gets inventory data from Clover.

**Headers:**
- `Authorization: Bearer <session-token>`

**Response:**
```json
[
  {
    "item_id": "item-id",
    "item_name": "Coffee Beans",
    "price": 12.00,
    "quantity": 50,
    "par_level": 100,
    "unit_cost": 8.00,
    "category": "beverage"
  },
  {
    "item_id": "item-id-2",
    "item_name": "Milk",
    "price": 4.00,
    "quantity": 20,
    "par_level": 40,
    "unit_cost": 2.50,
    "category": "dairy"
  }
]
```

#### `POST /api/clover/sync`
Syncs data from Clover to the application database.

**Headers:**
- `Authorization: Bearer <session-token>`

**Response:**
```json
{
  "status": "success",
  "synced": {
    "sales": 10,
    "inventory": 5,
    "employees": 3,
    "shifts": 8
  }
}
```

## AI Model API Endpoints

### Health Check

#### `GET /health`
Checks the health of the AI model API.

**Response:**
```json
{
  "status": "ok",
  "models": {
    "peak_hour_predictor": true,
    "inventory_optimizer": true,
    "staff_scheduler": true,
    "suggestion_generator": true
  }
}
```

### Peak Hour Prediction

#### `POST /predict/peak_hours`
Generates peak hour predictions.

**Request Body:**
```json
{
  "start_date": "2025-04-11",
  "days": 7,
  "shop_hours": [6, 22],
  "weather_data": {
    "2025-04-11": "sunny",
    "2025-04-12": "rainy"
  }
}
```

**Response:**
```json
[
  {
    "timestamp": "2025-04-11T08:00:00",
    "date": "2025-04-11",
    "hour": 8,
    "day_of_week": 5,
    "is_weekend": false,
    "predicted_customers": 35,
    "is_peak": true
  },
  {
    "timestamp": "2025-04-11T09:00:00",
    "date": "2025-04-11",
    "hour": 9,
    "day_of_week": 5,
    "is_weekend": false,
    "predicted_customers": 30,
    "is_peak": true
  }
]
```

### Inventory Optimization

#### `POST /optimize/inventory`
Optimizes inventory levels.

**Request Body:**
```json
{
  "inventory": [
    {
      "item_name": "Coffee Beans",
      "quantity": 50,
      "par_level": 100,
      "unit_cost": 12.00,
      "shelf_life_days": 90,
      "category": "beverage"
    },
    {
      "item_name": "Milk",
      "quantity": 20,
      "par_level": 40,
      "unit_cost": 4.00,
      "shelf_life_days": 7,
      "category": "dairy"
    }
  ],
  "sales": [
    {
      "timestamp": "2025-04-10T10:30:00",
      "item_name": "Coffee Beans",
      "quantity": 2
    },
    {
      "timestamp": "2025-04-10T11:15:00",
      "item_name": "Milk",
      "quantity": 3
    }
  ],
  "lead_times": {
    "Coffee Beans": 5,
    "Milk": 1
  }
}
```

**Response:**
```json
{
  "optimized_inventory": [
    {
      "item_name": "Coffee Beans",
      "quantity": 50,
      "par_level": 100,
      "unit_cost": 12.00,
      "shelf_life_days": 90,
      "category": "beverage",
      "avg_daily_sales": 2,
      "optimal_par_level": 14,
      "reorder_point": 8,
      "days_until_reorder": 21,
      "needs_reorder": false,
      "excess_stock": true
    },
    {
      "item_name": "Milk",
      "quantity": 20,
      "par_level": 40,
      "unit_cost": 4.00,
      "shelf_life_days": 7,
      "category": "dairy",
      "avg_daily_sales": 3,
      "optimal_par_level": 21,
      "reorder_point": 9,
      "days_until_reorder": 3.67,
      "needs_reorder": false,
      "excess_stock": false
    }
  ],
  "recommendations": {
    "items_to_reorder": [],
    "excess_items": [
      {
        "item_name": "Coffee Beans",
        "current_quantity": 50,
        "optimal_quantity": 14,
        "excess_amount": 36
      }
    ],
    "expiring_soon": [],
    "par_level_adjustments": [
      {
        "item_name": "Coffee Beans",
        "current_par": 100,
        "recommended_par": 14,
        "percent_change": -86
      },
      {
        "item_name": "Milk",
        "current_par": 40,
        "recommended_par": 21,
        "percent_change": -47.5
      }
    ]
  }
}
```

### Staff Scheduling

#### `POST /optimize/staff`
Optimizes staff scheduling.

**Request Body:**
```json
{
  "forecast": [
    {
      "timestamp": "2025-04-11T08:00:00",
      "hour": 8,
      "day_of_week": 5,
      "is_weekend": false,
      "predicted_customers": 35,
      "is_peak": true
    },
    {
      "timestamp": "2025-04-11T09:00:00",
      "hour": 9,
      "day_of_week": 5,
      "is_weekend": false,
      "predicted_customers": 30,
      "is_peak": true
    }
  ],
  "staff": [
    {
      "id": 1,
      "name": "John Smith",
      "hourly_rate": 18.00,
      "role": "Barista"
    },
    {
      "id": 2,
      "name": "Jane Doe",
      "hourly_rate": 25.00,
      "role": "Manager"
    }
  ],
  "current_schedule": [
    {
      "date": "2025-04-11",
      "staff_id": 1,
      "start_hour": 6,
      "end_hour": 14
    },
    {
      "date": "2025-04-11",
      "staff_id": 2,
      "start_hour": 10,
      "end_hour": 18
    }
  ]
}
```

**Response:**
```json
{
  "optimized_schedule": [
    {
      "date": "2025-04-11",
      "staff_id": 1,
      "staff_name": "John Smith",
      "staff_role": "Barista",
      "start_hour": 6,
      "end_hour": 14,
      "is_peak": true
    },
    {
      "date": "2025-04-11",
      "staff_id": 2,
      "staff_name": "Jane Doe",
      "staff_role": "Manager",
      "start_hour": 8,
      "end_hour": 16,
      "is_peak": true
    }
  ],
  "recommendations": {
    "schedule_changes": [
      {
        "date": "2025-04-11",
        "hour": 8,
        "predicted_customers": 35,
        "current_staff_count": 1,
        "recommended_staff_count": 2,
        "staff_to_add": [2],
        "staff_to_remove": []
      },
      {
        "date": "2025-04-11",
        "hour": 9,
        "predicted_customers": 30,
        "current_staff_count": 1,
        "recommended_staff_count": 2,
        "staff_to_add": [2],
        "staff_to_remove": []
      }
    ],
    "efficiency_improvement": {
      "current_overstaffed_hours": 0,
      "current_understaffed_hours": 2,
      "optimized_overstaffed_hours": 0,
      "optimized_understaffed_hours": 0,
      "hours_improved": 2,
      "cost_savings": 0
    },
    "peak_hour_staffing": [
      {
        "date": "2025-04-11",
        "hour": 8,
        "predicted_customers": 35,
        "current_staff_count": 1,
        "recommended_staff_count": 2,
        "additional_staff_needed": 1
      },
      {
        "date": "2025-04-11",
        "hour": 9,
        "predicted_customers": 30,
        "current_staff_count": 1,
        "recommended_staff_count": 2,
        "additional_staff_needed": 1
      }
    ]
  }
}
```

### Suggestion Generation

#### `POST /generate/suggestions`
Generates operational suggestions.

**Request Body:**
```json
{
  "sales": [
    {
      "timestamp": "2025-04-11T10:30:00",
      "item_name": "Latte",
      "amount": 4.50,
      "category": "beverage"
    },
    {
      "timestamp": "2025-04-11T10:35:00",
      "item_name": "Muffin",
      "amount": 3.25,
      "category": "food"
    }
  ],
  "inventory": [
    {
      "item_name": "Coffee Beans",
      "quantity": 10,
      "par_level": 100,
      "unit_cost": 12.00,
      "shelf_life_days": 90,
      "category": "beverage"
    },
    {
      "item_name": "Milk",
      "quantity": 5,
      "par_level": 40,
      "unit_cost": 4.00,
      "shelf_life_days": 7,
      "category": "dairy",
      "expiry_date": "2025-04-14"
    }
  ],
  "staff_schedule": [
    {
      "date": "2025-04-11",
      "staff_id": 1,
      "staff_name": "John Smith",
      "role": "Barista",
      "start_hour": 6,
      "end_hour": 14
    },
    {
      "date": "2025-04-11",
      "staff_id": 2,
      "staff_name": "Jane Doe",
      "role": "Manager",
      "start_hour": 10,
      "end_hour": 18
    }
  ],
  "peak_hour_forecast": [
    {
      "timestamp": "2025-04-11T08:00:00",
      "hour": 8,
      "day_of_week": 5,
      "is_weekend": false,
      "predicted_customers": 35,
      "is_peak": true
    },
    {
      "timestamp": "2025-04-11T09:00:00",
      "hour": 9,
      "day_of_week": 5,
      "is_weekend": false,
      "predicted_customers": 30,
      "is_peak": true
    }
  ]
}
```

**Response:**
```json
[
  {
    "category": "inventory",
    "suggestion": "Restock Coffee Beans soon, current stock is below 10% of par level",
    "priority": "high",
    "details": "{\"item_name\":\"Coffee Beans\",\"current_quantity\":10,\"par_level\":100,\"percent_of_par\":10,\"days_until_stockout\":1}"
  },
  {
    "category": "staffing",
    "suggestion": "Consider adding staff during 8-9 on Friday, customer wait times increased by 50%",
    "priority": "medium",
    "details": "{\"day_of_week\":5,\"hour\":8,\"predicted_customers\":35,\"current_staff_count\":1,\"recommended_staff_count\":2,\"additional_staff_needed\":1}"
  }
]
```

### Model Training

#### `POST /train/peak_hours`
Trains the peak hour prediction model.

**Request Body:**
```json
{
  "training_data": [
    {
      "timestamp": "2025-03-01T08:00:00",
      "customer_count": 25
    },
    {
      "timestamp": "2025-03-01T09:00:00",
      "customer_count": 30
    }
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Peak hour model trained successfully"
}
```

#### `POST /train/inventory`
Trains the inventory optimization model.

**Request Body:**
```json
{
  "training_data": [
    {
      "item_name": "Coffee Beans",
      "avg_daily_sales": 10,
      "lead_time_days": 5,
      "shelf_life_days": 90,
      "unit_cost": 12.00,
      "is_perishable": 0,
      "optimal_par_level": 70
    },
    {
      "item_name": "Milk",
      "avg_daily_sales": 15,
      "lead_time_days": 1,
      "shelf_life_days": 7,
      "unit_cost": 4.00,
      "is_perishable": 1,
      "optimal_par_level": 45
    }
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Inventory model trained successfully"
}
```

#### `POST /train/staff`
Trains the staff scheduling model.

**Request Body:**
```json
{
  "training_data": [
    {
      "hour": 8,
      "day_of_week": 5,
      "is_weekend": 0,
      "predicted_customers": 35,
      "is_peak": 1,
      "optimal_staff_count": 3
    },
    {
      "hour": 9,
      "day_of_week": 5,
      "is_weekend": 0,
      "predicted_customers": 30,
      "is_peak": 1,
      "optimal_staff_count": 2
    }
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Staff scheduling model trained successfully"
}
```

#### `POST /train/suggestions`
Trains the suggestion generator model.

**Request Body:**
```json
{
  "suggestions_data": [
    {
      "category": "inventory",
      "suggestion": "Restock Coffee Beans soon, current stock is below 10% of par level",
      "priority": "high"
    },
    {
      "category": "staffing",
      "suggestion": "Consider adding staff during 8-9 on Friday, customer wait times increased by 50%",
      "priority": "medium"
    }
  ],
  "features_data": [
    {
      "category_inventory": 1,
      "category_staffing": 0,
      "category_sales": 0,
      "category_operations": 0,
      "contains_low_stock": 1,
      "contains_expiring": 0,
      "contains_peak_hour": 0,
      "days_until_stockout": 1
    },
    {
      "category_inventory": 0,
      "category_staffing": 1,
      "category_sales": 0,
      "category_operations": 0,
      "contains_low_stock": 0,
      "contains_expiring": 0,
      "contains_peak_hour": 1,
      "days_until_stockout": 0
    }
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Suggestion generator model trained successfully"
}
```
