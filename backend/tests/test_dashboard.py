def create_authenticated_user(client, email, organization):
    registration = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Dashboard User",
            "password": "secure-password-123",
            "organization_name": organization,
        },
    )
    assert registration.status_code == 201
    login = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "secure-password-123"},
    )
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def create_product(client, headers, sku, quantity, threshold=None):
    return client.post(
        "/api/v1/products",
        json={
            "sku": sku,
            "name": sku,
            "stock_quantity": quantity,
            "low_stock_threshold": threshold,
            "cost_price": "2.50",
            "selling_price": "5.00",
        },
        headers=headers,
    )


def test_product_list_search_and_dashboard_thresholds(client):
    headers = create_authenticated_user(
        client,
        "dashboard@example.com",
        "Dashboard Store",
    )
    default_threshold_product = create_product(client, headers, "DEFAULT-LOW", 4)
    explicit_threshold_product = create_product(client, headers, "EXPLICIT-OK", 20, 10)
    assert default_threshold_product.status_code == 201
    assert explicit_threshold_product.status_code == 201
    assert default_threshold_product.json()["selling_price"] == "5.00"

    all_products = client.get("/api/v1/products", headers=headers)
    matching_products = client.get(
        "/api/v1/products?search=EXPLICIT",
        headers=headers,
    )
    assert len(all_products.json()) == 2
    assert [product["sku"] for product in matching_products.json()] == ["EXPLICIT-OK"]

    summary = client.get("/api/v1/dashboard/summary", headers=headers)
    assert summary.status_code == 200
    assert summary.json()["total_products"] == 2
    assert summary.json()["total_quantity_on_hand"] == 24
    assert [
        item["sku"] for item in summary.json()["low_stock_items"]
    ] == ["DEFAULT-LOW"]
    assert summary.json()["low_stock_items"][0]["low_stock_threshold"] == 5

    settings = client.patch(
        "/api/v1/settings",
        json={"default_low_stock_threshold": 3},
        headers=headers,
    )
    assert settings.status_code == 200

    changed_quantity = client.patch(
        f"/api/v1/products/{default_threshold_product.json()['id']}",
        json={"stock_quantity": 2},
        headers=headers,
    )
    assert changed_quantity.status_code == 200
    assert changed_quantity.json()["stock_quantity"] == 2

    updated_summary = client.get("/api/v1/dashboard/summary", headers=headers)
    assert updated_summary.json()["low_stock_items"][0]["low_stock_threshold"] == 3

    movements = client.get(
        f"/api/v1/products/{default_threshold_product.json()['id']}/stock-movements",
        headers=headers,
    )
    assert len(movements.json()) == 1
    assert movements.json()[0]["movement_type"] == "out"
    assert movements.json()[0]["quantity"] == 2


def test_default_threshold_is_organization_scoped(client):
    first_headers = create_authenticated_user(
        client,
        "settings-first@example.com",
        "Settings First",
    )
    second_headers = create_authenticated_user(
        client,
        "settings-second@example.com",
        "Settings Second",
    )

    changed = client.patch(
        "/api/v1/settings",
        json={"default_low_stock_threshold": 12},
        headers=first_headers,
    )
    first_settings = client.get("/api/v1/settings", headers=first_headers)
    second_settings = client.get("/api/v1/settings", headers=second_headers)

    assert changed.status_code == 200
    assert first_settings.json()["default_low_stock_threshold"] == 12
    assert second_settings.json()["default_low_stock_threshold"] == 5
