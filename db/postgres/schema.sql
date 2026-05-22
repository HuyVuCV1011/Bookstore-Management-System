--
-- PostgreSQL database dump
--

\restrict at73H5ZG8dRE5xxRMjeIUMaQTN3NtYEStL5CrJi5ccks967fx7dqoGCztX6XKSJ

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: authors; Type: TABLE; Schema: public; Owner: bookstore_user
--

CREATE TABLE public.authors (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    biography text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by uuid,
    updated_by uuid,
    deleted_at timestamp without time zone
);


ALTER TABLE public.authors OWNER TO bookstore_user;

--
-- Name: authors_id_seq; Type: SEQUENCE; Schema: public; Owner: bookstore_user
--

CREATE SEQUENCE public.authors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.authors_id_seq OWNER TO bookstore_user;

--
-- Name: authors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bookstore_user
--

ALTER SEQUENCE public.authors_id_seq OWNED BY public.authors.id;


--
-- Name: books; Type: TABLE; Schema: public; Owner: bookstore_user
--

CREATE TABLE public.books (
    id integer NOT NULL,
    category_id integer NOT NULL,
    author_id integer NOT NULL,
    publisher_id integer NOT NULL,
    title character varying(255) NOT NULL,
    isbn character varying(13),
    publication_year integer NOT NULL,
    price numeric(18,2) NOT NULL,
    stock_quantity integer DEFAULT 0 NOT NULL,
    description text,
    business_status character varying(50) NOT NULL,
    storage_location character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by uuid,
    updated_by uuid,
    deleted_at timestamp without time zone,
    cover_url text,
    CONSTRAINT books_business_status_check CHECK (((business_status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'DISCONTINUED'::character varying, 'OUT_OF_STOCK'::character varying])::text[]))),
    CONSTRAINT books_price_check CHECK ((price > (0)::numeric)),
    CONSTRAINT books_stock_quantity_check CHECK ((stock_quantity >= 0))
);


ALTER TABLE public.books OWNER TO bookstore_user;

--
-- Name: books_id_seq; Type: SEQUENCE; Schema: public; Owner: bookstore_user
--

CREATE SEQUENCE public.books_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.books_id_seq OWNER TO bookstore_user;

--
-- Name: books_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bookstore_user
--

ALTER SEQUENCE public.books_id_seq OWNED BY public.books.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: bookstore_user
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by uuid,
    updated_by uuid,
    deleted_at timestamp without time zone
);


ALTER TABLE public.categories OWNER TO bookstore_user;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: bookstore_user
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.categories_id_seq OWNER TO bookstore_user;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bookstore_user
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: bookstore_user
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    full_name character varying(255),
    phone_number character varying(50),
    email character varying(255) NOT NULL,
    address text,
    profile_completed boolean DEFAULT false NOT NULL,
    registration_date date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by uuid,
    updated_by uuid,
    deleted_at timestamp without time zone
);


ALTER TABLE public.customers OWNER TO bookstore_user;

--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: bookstore_user
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.customers_id_seq OWNER TO bookstore_user;

--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bookstore_user
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: flyway_schema_history; Type: TABLE; Schema: public; Owner: bookstore_user
--

CREATE TABLE public.flyway_schema_history (
    installed_rank integer NOT NULL,
    version character varying(50),
    description character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    script character varying(1000) NOT NULL,
    checksum integer,
    installed_by character varying(100) NOT NULL,
    installed_on timestamp without time zone DEFAULT now() NOT NULL,
    execution_time integer NOT NULL,
    success boolean NOT NULL
);


ALTER TABLE public.flyway_schema_history OWNER TO bookstore_user;

--
-- Name: inventory_transactions; Type: TABLE; Schema: public; Owner: bookstore_user
--

CREATE TABLE public.inventory_transactions (
    id bigint NOT NULL,
    book_id integer NOT NULL,
    transaction_type character varying(50) NOT NULL,
    quantity_change integer NOT NULL,
    reference_type character varying(50),
    reference_id integer,
    old_quantity integer NOT NULL,
    new_quantity integer NOT NULL,
    performed_by uuid NOT NULL,
    notes text,
    transaction_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT inventory_transactions_reference_type_check CHECK (((reference_type)::text = ANY ((ARRAY['PURCHASE_ORDER'::character varying, 'ORDER'::character varying, 'MANUAL'::character varying])::text[]))),
    CONSTRAINT inventory_transactions_transaction_type_check CHECK (((transaction_type)::text = ANY ((ARRAY['PURCHASE_IN'::character varying, 'SALE_OUT'::character varying, 'ADJUSTMENT'::character varying])::text[])))
);


ALTER TABLE public.inventory_transactions OWNER TO bookstore_user;

--
-- Name: inventory_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: bookstore_user
--

CREATE SEQUENCE public.inventory_transactions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.inventory_transactions_id_seq OWNER TO bookstore_user;

--
-- Name: inventory_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bookstore_user
--

ALTER SEQUENCE public.inventory_transactions_id_seq OWNED BY public.inventory_transactions.id;


--
-- Name: mv_catalog_statistics; Type: MATERIALIZED VIEW; Schema: public; Owner: bookstore_user
--

CREATE MATERIALIZED VIEW public.mv_catalog_statistics AS
 SELECT c.id AS category_id,
    c.name AS category_name,
    count(DISTINCT b.id) AS total_books,
    count(DISTINCT b.author_id) AS total_authors,
    count(DISTINCT b.publisher_id) AS total_publishers,
    sum(b.stock_quantity) AS total_stock,
    round(avg(b.price), 2) AS average_price,
    min(b.price) AS min_price,
    max(b.price) AS max_price,
    count(DISTINCT
        CASE
            WHEN ((b.business_status)::text = 'ACTIVE'::text) THEN b.id
            ELSE NULL::integer
        END) AS active_books,
    count(DISTINCT
        CASE
            WHEN ((b.business_status)::text = 'OUT_OF_STOCK'::text) THEN b.id
            ELSE NULL::integer
        END) AS out_of_stock_books,
    count(DISTINCT
        CASE
            WHEN ((b.business_status)::text = 'DISCONTINUED'::text) THEN b.id
            ELSE NULL::integer
        END) AS discontinued_books,
    now() AS last_refresh_time
   FROM (public.categories c
     LEFT JOIN public.books b ON (((c.id = b.category_id) AND (b.deleted_at IS NULL))))
  WHERE (c.deleted_at IS NULL)
  GROUP BY c.id, c.name
UNION ALL
 SELECT NULL::integer AS category_id,
    'ALL_CATEGORIES'::character varying AS category_name,
    count(DISTINCT b.id) AS total_books,
    count(DISTINCT b.author_id) AS total_authors,
    count(DISTINCT b.publisher_id) AS total_publishers,
    sum(b.stock_quantity) AS total_stock,
    round(avg(b.price), 2) AS average_price,
    min(b.price) AS min_price,
    max(b.price) AS max_price,
    count(DISTINCT
        CASE
            WHEN ((b.business_status)::text = 'ACTIVE'::text) THEN b.id
            ELSE NULL::integer
        END) AS active_books,
    count(DISTINCT
        CASE
            WHEN ((b.business_status)::text = 'OUT_OF_STOCK'::text) THEN b.id
            ELSE NULL::integer
        END) AS out_of_stock_books,
    count(DISTINCT
        CASE
            WHEN ((b.business_status)::text = 'DISCONTINUED'::text) THEN b.id
            ELSE NULL::integer
        END) AS discontinued_books,
    now() AS last_refresh_time
   FROM public.books b
  WHERE (b.deleted_at IS NULL)
  WITH NO DATA;


ALTER TABLE public.mv_catalog_statistics OWNER TO bookstore_user;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: bookstore_user
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    book_id integer NOT NULL,
    isbn_snapshot character varying(20) NOT NULL,
    title_snapshot character varying(255) NOT NULL,
    author_snapshot character varying(255),
    category_snapshot character varying(255),
    cover_url_snapshot text,
    quantity integer NOT NULL,
    unit_price numeric(18,2) NOT NULL,
    line_total numeric(18,2) NOT NULL,
    discount numeric(18,2) DEFAULT 0,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by uuid,
    updated_by uuid,
    deleted_at timestamp without time zone,
    CONSTRAINT order_items_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.order_items OWNER TO bookstore_user;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: bookstore_user
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_code character varying(50) NOT NULL,
    user_id uuid NOT NULL,
    status character varying(30) NOT NULL,
    ordered_at timestamp without time zone NOT NULL,
    subtotal_amount numeric(18,2) NOT NULL,
    shipping_fee numeric(18,2) NOT NULL,
    total_amount numeric(18,2) NOT NULL,
    payment_method character varying(50) NOT NULL,
    shipping_address text NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by uuid,
    updated_by uuid,
    deleted_at timestamp without time zone,
    payment_status character varying(30) DEFAULT 'UNPAID'::character varying NOT NULL
);


ALTER TABLE public.orders OWNER TO bookstore_user;

--
-- Name: COLUMN orders.payment_status; Type: COMMENT; Schema: public; Owner: bookstore_user
--

COMMENT ON COLUMN public.orders.payment_status IS 'Payment status: UNPAID, PARTIAL, PAID, REFUNDED';


--
-- Name: publishers; Type: TABLE; Schema: public; Owner: bookstore_user
--

CREATE TABLE public.publishers (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    address text,
    phone character varying(50),
    email character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by uuid,
    updated_by uuid,
    deleted_at timestamp without time zone
);


ALTER TABLE public.publishers OWNER TO bookstore_user;

--
-- Name: mv_inventory_reorder_report; Type: MATERIALIZED VIEW; Schema: public; Owner: bookstore_user
--

CREATE MATERIALIZED VIEW public.mv_inventory_reorder_report AS
 WITH sales_velocity AS (
         SELECT oi.book_id,
            count(DISTINCT oi.order_id) AS orders_count,
            sum(oi.quantity) AS total_sold_30d,
            round(((sum(oi.quantity))::numeric / 30.0), 2) AS avg_daily_sales,
            max(o.created_at) AS last_sale_date
           FROM (public.order_items oi
             JOIN public.orders o ON ((oi.order_id = o.id)))
          WHERE (((o.status)::text = ANY ((ARRAY['CONFIRMED'::character varying, 'PROCESSING'::character varying, 'SHIPPED'::character varying, 'COMPLETED'::character varying])::text[])) AND (o.deleted_at IS NULL) AND (o.created_at >= (now() - '30 days'::interval)))
          GROUP BY oi.book_id
        )
 SELECT b.id AS book_id,
    b.title,
    b.isbn,
    b.business_status,
    c.name AS category_name,
    a.name AS author_name,
    p.name AS publisher_name,
    b.stock_quantity AS current_stock,
    (0)::bigint AS pending_purchase_quantity,
    COALESCE(sv.total_sold_30d, (0)::bigint) AS total_sold_last_30_days,
    COALESCE(sv.avg_daily_sales, (0)::numeric) AS avg_daily_sales,
    COALESCE(sv.orders_count, (0)::bigint) AS orders_count_30d,
    sv.last_sale_date,
        CASE
            WHEN (COALESCE(sv.avg_daily_sales, (0)::numeric) = (0)::numeric) THEN (999)::numeric
            ELSE round(((b.stock_quantity)::numeric / NULLIF(sv.avg_daily_sales, (0)::numeric)), 1)
        END AS days_of_stock_remaining,
        CASE
            WHEN (COALESCE(sv.avg_daily_sales, (0)::numeric) > (0)::numeric) THEN (GREATEST((0)::numeric, (ceil((sv.avg_daily_sales * (30)::numeric)) - (b.stock_quantity)::numeric)))::integer
            ELSE 0
        END AS recommended_reorder_quantity,
        CASE
            WHEN (b.stock_quantity = 0) THEN 'URGENT'::text
            WHEN (COALESCE(sv.avg_daily_sales, (0)::numeric) = (0)::numeric) THEN 'LOW_PRIORITY'::text
            WHEN (((b.stock_quantity)::numeric / NULLIF(sv.avg_daily_sales, (0)::numeric)) <= (7)::numeric) THEN 'URGENT'::text
            WHEN (((b.stock_quantity)::numeric / NULLIF(sv.avg_daily_sales, (0)::numeric)) <= (14)::numeric) THEN 'HIGH'::text
            WHEN (((b.stock_quantity)::numeric / NULLIF(sv.avg_daily_sales, (0)::numeric)) <= (30)::numeric) THEN 'MEDIUM'::text
            ELSE 'LOW'::text
        END AS reorder_priority,
    NULL::timestamp without time zone AS last_purchase_date,
    now() AS last_refresh_time
   FROM ((((public.books b
     JOIN public.categories c ON ((b.category_id = c.id)))
     JOIN public.authors a ON ((b.author_id = a.id)))
     JOIN public.publishers p ON ((b.publisher_id = p.id)))
     LEFT JOIN sales_velocity sv ON ((b.id = sv.book_id)))
  WHERE ((b.deleted_at IS NULL) AND (c.deleted_at IS NULL) AND (a.deleted_at IS NULL) AND (p.deleted_at IS NULL) AND ((b.business_status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'OUT_OF_STOCK'::character varying])::text[])))
  ORDER BY
        CASE
            WHEN (b.stock_quantity = 0) THEN 1
            WHEN (COALESCE(sv.avg_daily_sales, (0)::numeric) = (0)::numeric) THEN 5
            WHEN (((b.stock_quantity)::numeric / NULLIF(sv.avg_daily_sales, (0)::numeric)) <= (7)::numeric) THEN 1
            WHEN (((b.stock_quantity)::numeric / NULLIF(sv.avg_daily_sales, (0)::numeric)) <= (14)::numeric) THEN 2
            WHEN (((b.stock_quantity)::numeric / NULLIF(sv.avg_daily_sales, (0)::numeric)) <= (30)::numeric) THEN 3
            ELSE 4
        END,
        CASE
            WHEN (COALESCE(sv.avg_daily_sales, (0)::numeric) = (0)::numeric) THEN (999)::numeric
            ELSE round(((b.stock_quantity)::numeric / NULLIF(sv.avg_daily_sales, (0)::numeric)), 1)
        END
  WITH NO DATA;


ALTER TABLE public.mv_inventory_reorder_report OWNER TO bookstore_user;

--
-- Name: mv_popular_books; Type: MATERIALIZED VIEW; Schema: public; Owner: bookstore_user
--

CREATE MATERIALIZED VIEW public.mv_popular_books AS
 SELECT b.id AS book_id,
    b.title,
    b.isbn,
    b.price,
    b.stock_quantity,
    b.business_status,
    c.id AS category_id,
    c.name AS category_name,
    a.id AS author_id,
    a.name AS author_name,
    p.id AS publisher_id,
    p.name AS publisher_name,
    COALESCE(sum(oi.quantity), (0)::bigint) AS total_quantity_sold,
    COALESCE(count(DISTINCT oi.order_id), (0)::bigint) AS total_orders,
    COALESCE(sum((oi.line_total - oi.discount)), (0)::numeric) AS total_revenue,
    round(COALESCE(avg(oi.unit_price), b.price), 2) AS average_selling_price,
    max(o.created_at) AS last_order_date,
    now() AS last_refresh_time
   FROM (((((public.books b
     JOIN public.categories c ON ((b.category_id = c.id)))
     JOIN public.authors a ON ((b.author_id = a.id)))
     JOIN public.publishers p ON ((b.publisher_id = p.id)))
     LEFT JOIN public.order_items oi ON ((b.id = oi.book_id)))
     LEFT JOIN public.orders o ON (((oi.order_id = o.id) AND ((o.status)::text = ANY ((ARRAY['CONFIRMED'::character varying, 'PROCESSING'::character varying, 'SHIPPED'::character varying, 'COMPLETED'::character varying])::text[])) AND (o.deleted_at IS NULL) AND (o.created_at >= (now() - '90 days'::interval)))))
  WHERE ((b.deleted_at IS NULL) AND (c.deleted_at IS NULL) AND (a.deleted_at IS NULL) AND (p.deleted_at IS NULL))
  GROUP BY b.id, b.title, b.isbn, b.price, b.stock_quantity, b.business_status, c.id, c.name, a.id, a.name, p.id, p.name
  ORDER BY COALESCE(sum(oi.quantity), (0)::bigint) DESC, COALESCE(sum((oi.line_total - oi.discount)), (0)::numeric) DESC
 LIMIT 100
  WITH NO DATA;


ALTER TABLE public.mv_popular_books OWNER TO bookstore_user;

--
-- Name: publishers_id_seq; Type: SEQUENCE; Schema: public; Owner: bookstore_user
--

CREATE SEQUENCE public.publishers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.publishers_id_seq OWNER TO bookstore_user;

--
-- Name: publishers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bookstore_user
--

ALTER SEQUENCE public.publishers_id_seq OWNED BY public.publishers.id;


--
-- Name: purchase_order_items; Type: TABLE; Schema: public; Owner: bookstore_user
--

CREATE TABLE public.purchase_order_items (
    id integer NOT NULL,
    purchase_order_id integer NOT NULL,
    book_id integer NOT NULL,
    quantity_ordered integer NOT NULL,
    quantity_received integer DEFAULT 0 NOT NULL,
    unit_cost numeric(18,2) NOT NULL,
    line_total numeric(18,2) NOT NULL,
    notes text,
    CONSTRAINT purchase_order_items_check CHECK (((quantity_received >= 0) AND (quantity_received <= quantity_ordered))),
    CONSTRAINT purchase_order_items_line_total_check CHECK ((line_total >= (0)::numeric)),
    CONSTRAINT purchase_order_items_quantity_ordered_check CHECK ((quantity_ordered > 0)),
    CONSTRAINT purchase_order_items_unit_cost_check CHECK ((unit_cost >= (0)::numeric))
);


ALTER TABLE public.purchase_order_items OWNER TO bookstore_user;

--
-- Name: purchase_order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: bookstore_user
--

CREATE SEQUENCE public.purchase_order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.purchase_order_items_id_seq OWNER TO bookstore_user;

--
-- Name: purchase_order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bookstore_user
--

ALTER SEQUENCE public.purchase_order_items_id_seq OWNED BY public.purchase_order_items.id;


--
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: bookstore_user
--

CREATE TABLE public.purchase_orders (
    id integer NOT NULL,
    po_number character varying(50) NOT NULL,
    supplier_id integer NOT NULL,
    status character varying(50) NOT NULL,
    order_date timestamp without time zone,
    expected_delivery_date date,
    total_amount numeric(18,2) DEFAULT 0 NOT NULL,
    notes text,
    created_by uuid NOT NULL,
    updated_by uuid NOT NULL,
    received_by uuid,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp without time zone,
    CONSTRAINT purchase_orders_status_check CHECK (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'SUBMITTED'::character varying, 'RECEIVING'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying])::text[])))
);


ALTER TABLE public.purchase_orders OWNER TO bookstore_user;

--
-- Name: purchase_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: bookstore_user
--

CREATE SEQUENCE public.purchase_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.purchase_orders_id_seq OWNER TO bookstore_user;

--
-- Name: purchase_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bookstore_user
--

ALTER SEQUENCE public.purchase_orders_id_seq OWNED BY public.purchase_orders.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: bookstore_user
--

CREATE TABLE public.refresh_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token character varying(500) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.refresh_tokens OWNER TO bookstore_user;

--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: bookstore_user
--

CREATE TABLE public.suppliers (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    contact_person character varying(255),
    phone character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    address text,
    payment_terms text,
    status character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by uuid,
    updated_by uuid,
    deleted_at timestamp without time zone,
    CONSTRAINT suppliers_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'INACTIVE'::character varying])::text[])))
);


ALTER TABLE public.suppliers OWNER TO bookstore_user;

--
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: bookstore_user
--

CREATE SEQUENCE public.suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.suppliers_id_seq OWNER TO bookstore_user;

--
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bookstore_user
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.suppliers.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: bookstore_user
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(20) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['CUSTOMER'::character varying, 'STAFF'::character varying, 'ADMIN'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO bookstore_user;

--
-- Name: warehouse_staff; Type: TABLE; Schema: public; Owner: bookstore_user
--

CREATE TABLE public.warehouse_staff (
    id uuid NOT NULL,
    full_name character varying(255) NOT NULL,
    phone_number character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    area_responsible character varying(100),
    hire_date date NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by uuid,
    updated_by uuid,
    deleted_at timestamp without time zone
);


ALTER TABLE public.warehouse_staff OWNER TO bookstore_user;

--
-- Name: authors id; Type: DEFAULT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.authors ALTER COLUMN id SET DEFAULT nextval('public.authors_id_seq'::regclass);


--
-- Name: books id; Type: DEFAULT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.books ALTER COLUMN id SET DEFAULT nextval('public.books_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: inventory_transactions id; Type: DEFAULT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.inventory_transactions ALTER COLUMN id SET DEFAULT nextval('public.inventory_transactions_id_seq'::regclass);


--
-- Name: publishers id; Type: DEFAULT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.publishers ALTER COLUMN id SET DEFAULT nextval('public.publishers_id_seq'::regclass);


--
-- Name: purchase_order_items id; Type: DEFAULT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.purchase_order_items ALTER COLUMN id SET DEFAULT nextval('public.purchase_order_items_id_seq'::regclass);


--
-- Name: purchase_orders id; Type: DEFAULT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.purchase_orders ALTER COLUMN id SET DEFAULT nextval('public.purchase_orders_id_seq'::regclass);


--
-- Name: suppliers id; Type: DEFAULT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- Name: authors authors_pkey; Type: CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.authors
    ADD CONSTRAINT authors_pkey PRIMARY KEY (id);


--
-- Name: books books_isbn_key; Type: CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_isbn_key UNIQUE (isbn);


--
-- Name: books books_pkey; Type: CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: customers customers_user_id_key; Type: CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_user_id_key UNIQUE (user_id);


--
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- Name: inventory_transactions inventory_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_code_key; Type: CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_code_key UNIQUE (order_code);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: publishers publishers_pkey; Type: CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.publishers
    ADD CONSTRAINT publishers_pkey PRIMARY KEY (id);


--
-- Name: purchase_order_items purchase_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_pkey PRIMARY KEY (id);


--
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);


--
-- Name: purchase_orders purchase_orders_po_number_key; Type: CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_po_number_key UNIQUE (po_number);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_key UNIQUE (token);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: warehouse_staff warehouse_staff_email_key; Type: CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.warehouse_staff
    ADD CONSTRAINT warehouse_staff_email_key UNIQUE (email);


--
-- Name: warehouse_staff warehouse_staff_pkey; Type: CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.warehouse_staff
    ADD CONSTRAINT warehouse_staff_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX flyway_schema_history_s_idx ON public.flyway_schema_history USING btree (success);


--
-- Name: idx_authors_deleted_at; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_authors_deleted_at ON public.authors USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_books_author_id; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_books_author_id ON public.books USING btree (author_id);


--
-- Name: idx_books_category_id; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_books_category_id ON public.books USING btree (category_id);


--
-- Name: idx_books_deleted_at; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_books_deleted_at ON public.books USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_books_isbn; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_books_isbn ON public.books USING btree (isbn) WHERE (isbn IS NOT NULL);


--
-- Name: idx_books_publisher_id; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_books_publisher_id ON public.books USING btree (publisher_id);


--
-- Name: idx_books_title; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_books_title ON public.books USING gin (to_tsvector('english'::regconfig, (title)::text));


--
-- Name: idx_categories_deleted_at; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_categories_deleted_at ON public.categories USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_categories_name_unique; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE UNIQUE INDEX idx_categories_name_unique ON public.categories USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_customers_email; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_customers_email ON public.customers USING btree (email);


--
-- Name: idx_customers_user_id; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_customers_user_id ON public.customers USING btree (user_id);


--
-- Name: idx_inventory_transactions_book_id; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_inventory_transactions_book_id ON public.inventory_transactions USING btree (book_id);


--
-- Name: idx_inventory_transactions_transaction_date; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_inventory_transactions_transaction_date ON public.inventory_transactions USING btree (transaction_date);


--
-- Name: idx_inventory_transactions_transaction_type; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_inventory_transactions_transaction_type ON public.inventory_transactions USING btree (transaction_type);


--
-- Name: idx_mv_catalog_statistics_category_id; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_mv_catalog_statistics_category_id ON public.mv_catalog_statistics USING btree (category_id);


--
-- Name: idx_mv_catalog_statistics_last_refresh; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_mv_catalog_statistics_last_refresh ON public.mv_catalog_statistics USING btree (last_refresh_time);


--
-- Name: idx_mv_inventory_reorder_book_id; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_mv_inventory_reorder_book_id ON public.mv_inventory_reorder_report USING btree (book_id);


--
-- Name: idx_mv_inventory_reorder_last_refresh; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_mv_inventory_reorder_last_refresh ON public.mv_inventory_reorder_report USING btree (last_refresh_time);


--
-- Name: idx_mv_inventory_reorder_priority; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_mv_inventory_reorder_priority ON public.mv_inventory_reorder_report USING btree (reorder_priority);


--
-- Name: idx_mv_inventory_reorder_stock_days; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_mv_inventory_reorder_stock_days ON public.mv_inventory_reorder_report USING btree (days_of_stock_remaining);


--
-- Name: idx_mv_popular_books_book_id; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_mv_popular_books_book_id ON public.mv_popular_books USING btree (book_id);


--
-- Name: idx_mv_popular_books_category_id; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_mv_popular_books_category_id ON public.mv_popular_books USING btree (category_id);


--
-- Name: idx_mv_popular_books_last_refresh; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_mv_popular_books_last_refresh ON public.mv_popular_books USING btree (last_refresh_time);


--
-- Name: idx_mv_popular_books_total_sold; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_mv_popular_books_total_sold ON public.mv_popular_books USING btree (total_quantity_sold DESC);


--
-- Name: idx_order_items_book_id; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_order_items_book_id ON public.order_items USING btree (book_id);


--
-- Name: idx_order_items_deleted_at; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_order_items_deleted_at ON public.order_items USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_order_items_isbn_snapshot; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_order_items_isbn_snapshot ON public.order_items USING btree (isbn_snapshot);


--
-- Name: idx_order_items_order_id; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_order_items_order_id ON public.order_items USING btree (order_id);


--
-- Name: idx_orders_deleted_at; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_orders_deleted_at ON public.orders USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_orders_ordered_at; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_orders_ordered_at ON public.orders USING btree (ordered_at DESC);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- Name: idx_orders_status_created; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_orders_status_created ON public.orders USING btree (status, created_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_orders_user_id; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_orders_user_id ON public.orders USING btree (user_id);


--
-- Name: idx_publishers_deleted_at; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_publishers_deleted_at ON public.publishers USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_purchase_order_items_book_id; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_purchase_order_items_book_id ON public.purchase_order_items USING btree (book_id);


--
-- Name: idx_purchase_order_items_po_id; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_purchase_order_items_po_id ON public.purchase_order_items USING btree (purchase_order_id);


--
-- Name: idx_purchase_orders_created_by; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_purchase_orders_created_by ON public.purchase_orders USING btree (created_by);


--
-- Name: idx_purchase_orders_order_date; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_purchase_orders_order_date ON public.purchase_orders USING btree (order_date);


--
-- Name: idx_purchase_orders_po_number; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_purchase_orders_po_number ON public.purchase_orders USING btree (po_number);


--
-- Name: idx_purchase_orders_status; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_purchase_orders_status ON public.purchase_orders USING btree (status);


--
-- Name: idx_purchase_orders_supplier_id; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_purchase_orders_supplier_id ON public.purchase_orders USING btree (supplier_id);


--
-- Name: idx_refresh_tokens_expires_at; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_refresh_tokens_expires_at ON public.refresh_tokens USING btree (expires_at);


--
-- Name: idx_refresh_tokens_token; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_refresh_tokens_token ON public.refresh_tokens USING btree (token);


--
-- Name: idx_refresh_tokens_user_id; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_refresh_tokens_user_id ON public.refresh_tokens USING btree (user_id);


--
-- Name: idx_suppliers_name; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_suppliers_name ON public.suppliers USING btree (name);


--
-- Name: idx_suppliers_status; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_suppliers_status ON public.suppliers USING btree (status);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: idx_warehouse_staff_email; Type: INDEX; Schema: public; Owner: bookstore_user
--

CREATE INDEX idx_warehouse_staff_email ON public.warehouse_staff USING btree (email);


--
-- Name: authors authors_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.authors
    ADD CONSTRAINT authors_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: authors authors_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.authors
    ADD CONSTRAINT authors_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: books books_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.authors(id);


--
-- Name: books books_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: books books_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: books books_publisher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_publisher_id_fkey FOREIGN KEY (publisher_id) REFERENCES public.publishers(id);


--
-- Name: books books_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: categories categories_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: categories categories_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: customers customers_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: customers customers_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: customers customers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: inventory_transactions inventory_transactions_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id);


--
-- Name: inventory_transactions inventory_transactions_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.users(id);


--
-- Name: order_items order_items_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id);


--
-- Name: order_items order_items_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: orders orders_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: orders orders_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: publishers publishers_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.publishers
    ADD CONSTRAINT publishers_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: publishers publishers_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.publishers
    ADD CONSTRAINT publishers_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: purchase_order_items purchase_order_items_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id);


--
-- Name: purchase_order_items purchase_order_items_purchase_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id);


--
-- Name: purchase_orders purchase_orders_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: purchase_orders purchase_orders_received_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_received_by_fkey FOREIGN KEY (received_by) REFERENCES public.users(id);


--
-- Name: purchase_orders purchase_orders_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: purchase_orders purchase_orders_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: suppliers suppliers_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: suppliers suppliers_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: warehouse_staff warehouse_staff_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.warehouse_staff
    ADD CONSTRAINT warehouse_staff_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: warehouse_staff warehouse_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.warehouse_staff
    ADD CONSTRAINT warehouse_staff_id_fkey FOREIGN KEY (id) REFERENCES public.users(id);


--
-- Name: warehouse_staff warehouse_staff_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bookstore_user
--

ALTER TABLE ONLY public.warehouse_staff
    ADD CONSTRAINT warehouse_staff_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict at73H5ZG8dRE5xxRMjeIUMaQTN3NtYEStL5CrJi5ccks967fx7dqoGCztX6XKSJ

