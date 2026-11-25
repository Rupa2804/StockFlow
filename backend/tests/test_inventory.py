def create_authenticated_user(
    client,
    email="inventory@example.com",
    organization="Inventory Org",
):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Inventory User",
            "password": "secure-password-123",
            "organization_name": organization,
        },
    )
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": email,
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

    empty_history = client.get(
        f"/api/v1/products/{product_id}/stock-movements",
        headers=headers,
    )
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

    product = client.get(f"/api/v1/products/{product_id}", headers=headers)
    assert product.status_code == 200
    assert product.json()["stock_quantity"] == 6

    history = client.get(
        f"/api/v1/products/{product_id}/stock-movements",
        headers=headers,
    )
    assert [item["movement_type"] for item in history.json()] == ["out", "in"]


def test_inventory_mutations_require_authentication(client):
    response = client.post(
        "/api/v1/categories",
        json={"name": "Restricted"},
    )

    assert response.status_code == 401


def test_categories_and_products_are_isolated_by_organization(client):
    first_headers = create_authenticated_user(
        client,
        "first@example.com",
        "First Store",
    )
    second_headers = create_authenticated_user(
        client,
        "second@example.com",
        "Second Store",
    )

    first_category = client.post(
        "/api/v1/categories",
        json={"name": "General"},
        headers=first_headers,
    )
    second_category = client.post(
        "/api/v1/categories",
        json={"name": "General"},
        headers=second_headers,
    )
    assert first_category.status_code == 201
    assert second_category.status_code == 201
    own_category = client.get(
        f"/api/v1/categories/{first_category.json()['id']}",
        headers=first_headers,
    )
    assert own_category.status_code == 200
    assert own_category.json()["name"] == "General"

    first_product = client.post(
        "/api/v1/products",
        json={
            "sku": "SHARED-SKU",
            "name": "First product",
            "unit_price": "4.00",
            "category_id": first_category.json()["id"],
        },
        headers=first_headers,
    )
    second_product = client.post(
        "/api/v1/products",
        json={
            "sku": "SHARED-SKU",
            "name": "Second product",
            "unit_price": "6.00",
            "category_id": second_category.json()["id"],
        },
        headers=second_headers,
    )
    assert first_product.status_code == 201
    assert second_product.status_code == 201

    first_products = client.get("/api/v1/products", headers=first_headers)
    assert [product["name"] for product in first_products.json()] == ["First product"]
    assert (
        client.get(
            f"/api/v1/products/{second_product.json()['id']}",
            headers=first_headers,
        ).status_code
        == 404
    )
    assert (
        client.get(
            f"/api/v1/categories/{second_category.json()['id']}",
            headers=first_headers,
        ).status_code
        == 404
    )
