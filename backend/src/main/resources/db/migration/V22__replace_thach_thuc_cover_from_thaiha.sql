UPDATE books
SET
    cover_url = 'https://product.hstatic.net/200000900535/product/thach-thuc-tu-con-so-0_bia-1-doi-bia_e55d856a4b5a4e198c5b95461624b09d.jpg',
    updated_at = CURRENT_TIMESTAMP
WHERE deleted_at IS NULL
  AND isbn = '9786045933329';
