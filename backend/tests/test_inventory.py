def create_authenticated_user(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "inventory@example.com",
            "full_name": "Inventory User",
            "password": "secure-password-123",
        },
    )
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "inventory@example.com",
            "password": "secure-password-123",
        },
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_stock_movements_update_inventory_and_prevent_overdraw(client):
    headers = create_authenticated_user(client)
    category_response = client.post(
        "/api/v1/categories",
        json={"name": "Office", "description": "Office supplies"},
        headers=headers,
    )
    assert category_response.status_code == 201

    product_response = client.post(
        "/api/v1/products",
        json={
            "sku": "PEN-001",
            "name": "Blue pen",
            "unit_price": "1.25",
            "category_id": category_response.json()["id"],
        },
        headers=headers,
    )
    assert product_response.status_code == 201
    product_id = product_response.json()["id"]

    empty_history = client.get(f"/api/v1/products/{product_id}/stock-movements")
    assert empty_history.status_code == 200
    assert empty_history.json() == []

    stock_in = client.post(
        f"/api/v1/products/{product_id}/stock-movements",
        json={"movement_type": "in", "quantity": 10, "note": "Initial delivery"},
        headers=headers,
    )
    assert stock_in.status_code == 201

    stock_out = client.post(
        f"/api/v1/products/{product_id}/stock-movements",
        json={"movement_type": "out", "quantity": 4},
        headers=headers,
    )
    assert stock_out.status_code == 201

    overdraw = client.post(
        f"/api/v1/products/{product_id}/stock-movements",
        json={"movement_type": "out", "quantity": 7},
        headers=headers,
    )
    assert overdraw.status_code == 409

    product = client.get(f"/api/v1/products/{product_id}")
    assert product.status_code == 200
    assert product.json()["stock_quantity"] == 6

    history = client.get(f"/api/v1/products/{product_id}/stock-movements")
    assert [item["movement_type"] for item in history.json()] == ["out", "in"]


def test_inventory_mutations_require_authentication(client):
    response = client.post(
        "/api/v1/categories",
        json={"name": "Restricted"},
    )

    assert response.status_code == 401
