from alembic import op
import sqlalchemy as sa

from app.database import Base
from app.models.category import Category
from app.models.invitation import OrganizationInvitation
from app.models.organization import Organization
from app.models.product import Product
from app.models.stock_movement import StockMovement
from app.models.user import User


revision = "20261125_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())
    inventory_tables = {"users", "categories", "products", "stock_movements"}

    if not tables.intersection(inventory_tables):
        Base.metadata.create_all(bind=bind)
        return
    if not inventory_tables.issubset(tables):
        raise RuntimeError("Cannot migrate a partial StockFlow schema")

    if "organizations" not in tables:
        op.create_table(
            "organizations",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("name", sa.String(length=160), nullable=False),
            sa.Column(
                "default_low_stock_threshold",
                sa.Integer(),
                server_default="5",
                nullable=False,
            ),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
        )
    if "organization_invitations" not in tables:
        op.create_table(
            "organization_invitations",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("email", sa.String(length=320), nullable=False),
            sa.Column("organization_id", sa.Integer(), nullable=False),
            sa.Column("invited_by_user_id", sa.Integer(), nullable=False),
            sa.Column("token_hash", sa.String(length=64), nullable=False, unique=True),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("accepted_at", sa.DateTime(timezone=True)),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            sa.ForeignKeyConstraint(
                ["organization_id"],
                ["organizations.id"],
                ondelete="CASCADE",
                name="fk_organization_invitations_organization_id",
            ),
            sa.ForeignKeyConstraint(
                ["invited_by_user_id"],
                ["users.id"],
                ondelete="RESTRICT",
                name="fk_organization_invitations_invited_by_user_id",
            ),
        )
        op.create_index(
            "ix_organization_invitations_email",
            "organization_invitations",
            ["email"],
        )
        op.create_index(
            "ix_organization_invitations_organization_id",
            "organization_invitations",
            ["organization_id"],
        )
    invitation_indexes = {
        index["name"]
        for index in sa.inspect(bind).get_indexes("organization_invitations")
    }
    if "ix_organization_invitations_id" not in invitation_indexes:
        op.create_index(
            "ix_organization_invitations_id",
            "organization_invitations",
            ["id"],
        )

    for table_name in inventory_tables:
        columns = {column["name"] for column in sa.inspect(bind).get_columns(table_name)}
        if "organization_id" not in columns:
            op.add_column(
                table_name,
                sa.Column("organization_id", sa.Integer(), nullable=True),
            )

    product_columns = {
        column["name"]: column
        for column in sa.inspect(bind).get_columns("products")
    }
    if "cost_price" not in product_columns:
        op.add_column("products", sa.Column("cost_price", sa.Numeric(12, 2)))
    if "selling_price" not in product_columns:
        op.add_column("products", sa.Column("selling_price", sa.Numeric(12, 2)))
    if "low_stock_threshold" not in product_columns:
        op.add_column("products", sa.Column("low_stock_threshold", sa.Integer()))
    if "unit_price" in product_columns and not product_columns["unit_price"]["nullable"]:
        op.alter_column(
            "products",
            "unit_price",
            existing_type=sa.Numeric(),
            nullable=True,
        )

    default_organization_id = bind.execute(
        sa.text("SELECT id FROM organizations WHERE name = 'StockFlow' ORDER BY id LIMIT 1")
    ).scalar_one_or_none()
    if default_organization_id is None:
        default_organization_id = bind.execute(
            sa.text(
                "INSERT INTO organizations (name, default_low_stock_threshold) "
                "VALUES ('StockFlow', 5) RETURNING id"
            )
        ).scalar_one()

    organization_indexes = {
        index["name"] for index in sa.inspect(bind).get_indexes("organizations")
    }
    if "ix_organizations_id" not in organization_indexes:
        op.create_index("ix_organizations_id", "organizations", ["id"])

    for table_name in inventory_tables:
        bind.execute(
            sa.text(
                f"UPDATE {table_name} SET organization_id = :organization_id"
            ),
            {"organization_id": default_organization_id},
        )

    bind.execute(
        sa.text(
            "UPDATE products SET selling_price = unit_price "
            "WHERE selling_price IS NULL AND unit_price IS NOT NULL"
        )
    )

    for table_name in inventory_tables:
        op.alter_column(
            table_name,
            "organization_id",
            existing_type=sa.Integer(),
            nullable=False,
        )

    for table_name, ondelete in (
        ("users", "RESTRICT"),
        ("categories", "CASCADE"),
        ("products", "CASCADE"),
        ("stock_movements", "RESTRICT"),
    ):
        foreign_keys = sa.inspect(bind).get_foreign_keys(table_name)
        if not any(
            foreign_key["constrained_columns"] == ["organization_id"]
            and foreign_key["referred_table"] == "organizations"
            for foreign_key in foreign_keys
        ):
            op.create_foreign_key(
                f"fk_{table_name}_organization_id",
                table_name,
                "organizations",
                ["organization_id"],
                ["id"],
                ondelete=ondelete,
            )

    for table_name in inventory_tables:
        index_name = f"ix_{table_name}_organization_id"
        index_names = {index["name"] for index in sa.inspect(bind).get_indexes(table_name)}
        if index_name not in index_names:
            op.create_index(index_name, table_name, ["organization_id"])

    for table_name, legacy_column in (("products", "sku"), ("categories", "name")):
        for index in sa.inspect(bind).get_indexes(table_name):
            if index.get("unique") and index.get("column_names") == [legacy_column]:
                op.drop_index(index["name"], table_name=table_name)

        for constraint in sa.inspect(bind).get_unique_constraints(table_name):
            if constraint.get("column_names") == [legacy_column]:
                op.drop_constraint(
                    constraint["name"],
                    table_name,
                    type_="unique",
                )

    product_checks = {
        constraint["name"]
        for constraint in sa.inspect(bind).get_check_constraints("products")
    }
    for name, expression in (
        ("ck_products_cost_price_nonnegative", "cost_price IS NULL OR cost_price >= 0"),
        (
            "ck_products_selling_price_nonnegative",
            "selling_price IS NULL OR selling_price >= 0",
        ),
        (
            "ck_products_low_stock_threshold_nonnegative",
            "low_stock_threshold IS NULL OR low_stock_threshold >= 0",
        ),
    ):
        if name not in product_checks:
            op.create_check_constraint(name, "products", expression)

    product_indexes = {index["name"] for index in sa.inspect(bind).get_indexes("products")}
    if "uq_products_org_sku" not in product_indexes:
        op.create_index(
            "uq_products_org_sku",
            "products",
            ["organization_id", "sku"],
            unique=True,
        )
    category_indexes = {index["name"] for index in sa.inspect(bind).get_indexes("categories")}
    if "uq_categories_org_name" not in category_indexes:
        op.create_index(
            "uq_categories_org_name",
            "categories",
            ["organization_id", "name"],
            unique=True,
        )


def downgrade() -> None:
    raise RuntimeError("This data-preserving tenant migration cannot be downgraded automatically")
