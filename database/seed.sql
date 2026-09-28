INSERT INTO tipos_servico (nome)
VALUES
    ('Instalação'),
    ('Manutenção'),
    ('Vistoria')
ON CONFLICT (nome) DO NOTHING;