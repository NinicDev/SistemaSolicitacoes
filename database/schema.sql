--
-- PostgreSQL database dump
--

\restrict sEpG2r8oE1FB40tZpiE3N4Lqf05cQXJPTHUfAlfYNlu1aJNSa32lwJZRa6l0Z2A

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
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
-- Name: anexos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.anexos (
    id integer NOT NULL,
    id_solicitacao integer NOT NULL,
    nome_original character varying(255) NOT NULL,
    caminho_arquivo character varying(500) NOT NULL,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: anexos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.anexos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: anexos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.anexos_id_seq OWNED BY public.anexos.id;


--
-- Name: codigos_verificacao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.codigos_verificacao (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    codigo_hash character varying(255) NOT NULL,
    tipo character varying(30) NOT NULL,
    expira_em timestamp without time zone NOT NULL,
    usado_em timestamp without time zone,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: codigos_verificacao_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.codigos_verificacao_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: codigos_verificacao_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.codigos_verificacao_id_seq OWNED BY public.codigos_verificacao.id;


--
-- Name: responsaveis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.responsaveis (
    id integer NOT NULL,
    nome character varying(100) NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    usuario_id integer NOT NULL
);


--
-- Name: responsaveis_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.responsaveis_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: responsaveis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.responsaveis_id_seq OWNED BY public.responsaveis.id;


--
-- Name: solicitacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solicitacoes (
    id integer NOT NULL,
    nome character varying(80) NOT NULL,
    cpf character varying(11) NOT NULL,
    rg character varying(20),
    telefone_celular character varying(20),
    rua character varying(150),
    numero character varying(10),
    bairro character varying(150),
    cidade character varying(100),
    uf character varying(2),
    cep character varying(8) NOT NULL,
    complemento character varying(100),
    responsavel_id integer,
    tipo_servico_id integer NOT NULL,
    prioridade character varying(10) DEFAULT 'MEDIO'::character varying NOT NULL,
    descricao text,
    criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'ABERTA'::character varying NOT NULL,
    CONSTRAINT chk_prioridade CHECK (((prioridade)::text = ANY ((ARRAY['BAIXO'::character varying, 'MEDIO'::character varying, 'ALTO'::character varying])::text[]))),
    CONSTRAINT chk_status CHECK (((status)::text = ANY ((ARRAY['ABERTA'::character varying, 'EM_ANDAMENTO'::character varying, 'CONCLUIDA'::character varying, 'CANCELADA'::character varying])::text[])))
);


--
-- Name: solicitacoes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.solicitacoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: solicitacoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.solicitacoes_id_seq OWNED BY public.solicitacoes.id;


--
-- Name: tipos_servico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipos_servico (
    id integer NOT NULL,
    nome character varying(100) NOT NULL
);


--
-- Name: tipos_servico_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tipos_servico_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipos_servico_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tipos_servico_id_seq OWNED BY public.tipos_servico.id;


--
-- Name: tokens_invalidados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tokens_invalidados (
    id integer NOT NULL,
    jti_id character varying(45) NOT NULL,
    expira_em timestamp without time zone NOT NULL,
    criado_em timestamp without time zone NOT NULL,
    invalidado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: tokens_invalidados_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tokens_invalidados_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tokens_invalidados_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tokens_invalidados_id_seq OWNED BY public.tokens_invalidados.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    usuario character varying(100) NOT NULL,
    senha character varying(255) NOT NULL,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    email character varying(255) NOT NULL,
    email_verificado boolean DEFAULT false NOT NULL,
    nivel_acesso character varying(20) DEFAULT 'VISUALIZADOR'::character varying NOT NULL,
    CONSTRAINT usuarios_nivel_acesso_check CHECK (((nivel_acesso)::text = ANY ((ARRAY['ADMIN'::character varying, 'OPERADOR'::character varying, 'VISUALIZADOR'::character varying])::text[])))
);


--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: view_email_verificacao; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.view_email_verificacao AS
 SELECT id,
    email_verificado,
    email
   FROM public.usuarios;


--
-- Name: view_solicitacoes_registro; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.view_solicitacoes_registro AS
 SELECT s.id,
    s.nome,
    s.cpf,
    s.rg,
    s.telefone_celular,
    s.rua,
    s.numero,
    s.bairro,
    s.cidade,
    s.uf,
    s.cep,
    s.complemento,
    s.responsavel_id,
    s.tipo_servico_id,
    s.prioridade,
    s.descricao,
    s.criado_em,
    s.status,
    r.nome AS responsavel,
    ts.nome AS tipo_servico
   FROM ((public.solicitacoes s
     LEFT JOIN public.responsaveis r ON ((s.responsavel_id = r.id)))
     JOIN public.tipos_servico ts ON ((s.tipo_servico_id = ts.id)));


--
-- Name: anexos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anexos ALTER COLUMN id SET DEFAULT nextval('public.anexos_id_seq'::regclass);


--
-- Name: codigos_verificacao id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codigos_verificacao ALTER COLUMN id SET DEFAULT nextval('public.codigos_verificacao_id_seq'::regclass);


--
-- Name: responsaveis id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.responsaveis ALTER COLUMN id SET DEFAULT nextval('public.responsaveis_id_seq'::regclass);


--
-- Name: solicitacoes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitacoes ALTER COLUMN id SET DEFAULT nextval('public.solicitacoes_id_seq'::regclass);


--
-- Name: tipos_servico id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_servico ALTER COLUMN id SET DEFAULT nextval('public.tipos_servico_id_seq'::regclass);


--
-- Name: tokens_invalidados id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tokens_invalidados ALTER COLUMN id SET DEFAULT nextval('public.tokens_invalidados_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Name: anexos anexos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anexos
    ADD CONSTRAINT anexos_pkey PRIMARY KEY (id);


--
-- Name: codigos_verificacao codigos_verificacao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codigos_verificacao
    ADD CONSTRAINT codigos_verificacao_pkey PRIMARY KEY (id);


--
-- Name: responsaveis responsaveis_nome_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.responsaveis
    ADD CONSTRAINT responsaveis_nome_key UNIQUE (nome);


--
-- Name: responsaveis responsaveis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.responsaveis
    ADD CONSTRAINT responsaveis_pkey PRIMARY KEY (id);


--
-- Name: responsaveis responsaveis_usuario_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.responsaveis
    ADD CONSTRAINT responsaveis_usuario_id_key UNIQUE (usuario_id);


--
-- Name: solicitacoes solicitacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitacoes
    ADD CONSTRAINT solicitacoes_pkey PRIMARY KEY (id);


--
-- Name: tipos_servico tipos_servico_nome_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_servico
    ADD CONSTRAINT tipos_servico_nome_key UNIQUE (nome);


--
-- Name: tipos_servico tipos_servico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_servico
    ADD CONSTRAINT tipos_servico_pkey PRIMARY KEY (id);


--
-- Name: tokens_invalidados tokens_invalidados_jti_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tokens_invalidados
    ADD CONSTRAINT tokens_invalidados_jti_id_key UNIQUE (jti_id);


--
-- Name: tokens_invalidados tokens_invalidados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tokens_invalidados
    ADD CONSTRAINT tokens_invalidados_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_unique UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_usuario_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_usuario_key UNIQUE (usuario);


--
-- Name: anexos anexos_id_solicitacao_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anexos
    ADD CONSTRAINT anexos_id_solicitacao_fkey FOREIGN KEY (id_solicitacao) REFERENCES public.solicitacoes(id) ON DELETE CASCADE;


--
-- Name: codigos_verificacao codigos_verificacao_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codigos_verificacao
    ADD CONSTRAINT codigos_verificacao_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: responsaveis fk_responsaveis_usuario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.responsaveis
    ADD CONSTRAINT fk_responsaveis_usuario FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: solicitacoes fk_responsavel; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitacoes
    ADD CONSTRAINT fk_responsavel FOREIGN KEY (responsavel_id) REFERENCES public.responsaveis(id);


--
-- Name: solicitacoes fk_tipo_servico; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitacoes
    ADD CONSTRAINT fk_tipo_servico FOREIGN KEY (tipo_servico_id) REFERENCES public.tipos_servico(id);


--
-- PostgreSQL database dump complete
--

\unrestrict sEpG2r8oE1FB40tZpiE3N4Lqf05cQXJPTHUfAlfYNlu1aJNSa32lwJZRa6l0Z2A

