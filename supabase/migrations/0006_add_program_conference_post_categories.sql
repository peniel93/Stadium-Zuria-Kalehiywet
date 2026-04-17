insert into public.post_categories (code, name_en, name_am)
values
  ('program', 'Program', 'ፕሮግራም'),
  ('conference', 'Conference', 'ኮንፈረንስ')
on conflict (code) do nothing;
