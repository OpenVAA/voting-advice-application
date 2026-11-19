-- migration header comment
create table foo (
  id uuid primary key, -- trailing comment
  name text
);

/* block
   comment */
grant select on foo to anon;
