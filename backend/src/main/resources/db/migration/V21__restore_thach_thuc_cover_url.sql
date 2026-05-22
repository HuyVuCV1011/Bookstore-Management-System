UPDATE books
SET
    cover_url = 'https://thuvienso.quochoi.vn/retrieve/2dbe0756-af48-45dc-a4f5-b42b363c8db3/VV00041027_Thach%20thuc%20tu%20con%20so%200_2015.pdf.jpg',
    updated_at = CURRENT_TIMESTAMP
WHERE deleted_at IS NULL
  AND isbn = '9786045933329';
