-- Google Books returns a valid HTTP 200 placeholder for some real ISBNs.
-- Replace those placeholder-prone URLs with verified cover image URLs.

UPDATE books
SET cover_url = CASE isbn
    WHEN '9786043494860' THEN 'https://bizweb.dktcdn.net/100/326/228/products/nhat-ky-trong-tu-by-ho-chi-minh-bookworm-hanoi.jpg?v=1731570934873'
    WHEN '9786044913704' THEN 'https://product.hstatic.net/200000845405/product/2024_06_11_10_32_42_1-390x510_752c5d25f78c46a68d70d039190f696d.jpg'
    WHEN '9786049570735' THEN 'https://product.hstatic.net/200000845405/product/p94358mimage_240307_64323ae6a78746caa2e530dcbac35006.jpg'
    WHEN '9780671027032' THEN 'https://covers.openlibrary.org/b/isbn/9780671027032-L.jpg'
    WHEN '9786048922283' THEN 'https://product.hstatic.net/200000845405/product/p81462mnghe_thuat_toi_44bcbea568784c8eb93bc63d88bbd34c.jpg'
    WHEN '9786045933329' THEN 'https://thuvienso.quochoi.vn/retrieve/2dbe0756-af48-45dc-a4f5-b42b363c8db3/VV00041027_Thach%20thuc%20tu%20con%20so%200_2015.pdf.jpg'
    WHEN '9786040320179' THEN 'https://product.hstatic.net/200000122283/product/jfgjgjgfj_234b1a96dc9d42a9be985e91f8b415f5.jpg'
    WHEN '9786040351999' THEN 'https://product.hstatic.net/200000122283/product/sgk_8__12__ee79fd36b37b4cb39f5e705eb9018166.png'
    WHEN '9786045798102' THEN 'https://thuvienso.quochoi.vn/retrieve/6dbac6a5-b101-44a4-847c-9779d0d90600/VV00024904_Giao%20trinh%20tu%20tuong%20Ho%20Chi%20Minh_2006.pdf.jpg'
    WHEN '9786048871437' THEN 'https://nhasachminhthang.vn/Data/Upload/ResizeImage/~/userfiles/files/ngoaingu/16f2ffd08e4fbc8337d7a344870e26ab__1_x300x0x2.png'

    WHEN '9780062315007' THEN 'https://covers.openlibrary.org/b/isbn/9780062315007-L.jpg'
    WHEN '9780451524935' THEN 'https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg'
    WHEN '9780743269513' THEN 'https://covers.openlibrary.org/b/isbn/9780743269513-L.jpg'
    WHEN '9780735211292' THEN 'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg'
    WHEN '9780140455526' THEN 'https://covers.openlibrary.org/b/isbn/9780140455526-L.jpg'
    WHEN '9781591846444' THEN 'https://covers.openlibrary.org/b/isbn/9781591846444-L.jpg'
    WHEN '9781612680194' THEN 'https://covers.openlibrary.org/b/isbn/9781612680194-L.jpg'
    WHEN '9780062464316' THEN 'https://covers.openlibrary.org/b/isbn/9780062464316-L.jpg'
    WHEN '9780307887894' THEN 'https://covers.openlibrary.org/b/isbn/9780307887894-L.jpg'
    WHEN '9781455586691' THEN 'https://covers.openlibrary.org/b/isbn/9781455586691-L.jpg'
    WHEN '9780553380163' THEN 'https://covers.openlibrary.org/b/isbn/9780553380163-L.jpg'
    WHEN '9781585424337' THEN 'https://covers.openlibrary.org/b/isbn/9781585424337-L.jpg'
    WHEN '9780062457714' THEN 'https://covers.openlibrary.org/b/isbn/9780062457714-L.jpg'
    WHEN '9780316017930' THEN 'https://covers.openlibrary.org/b/isbn/9780316017930-L.jpg'
    WHEN '9780062316097' THEN 'https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg'
    WHEN '9781577314806' THEN 'https://covers.openlibrary.org/b/isbn/9781577314806-L.jpg'
    WHEN '9780812968255' THEN 'https://covers.openlibrary.org/b/isbn/9780812968255-L.jpg'
    WHEN '9780345472328' THEN 'https://covers.openlibrary.org/b/isbn/9780345472328-L.jpg'
    WHEN '9780374533557' THEN 'https://covers.openlibrary.org/b/isbn/9780374533557-L.jpg'
    WHEN '9780066620992' THEN 'https://covers.openlibrary.org/b/isbn/9780066620992-L.jpg'
    WHEN '9780804139021' THEN 'https://covers.openlibrary.org/b/isbn/9780804139021-L.jpg'
    WHEN '9780807014271' THEN 'https://covers.openlibrary.org/b/isbn/9780807014271-L.jpg'
    WHEN '9780316346627' THEN 'https://covers.openlibrary.org/b/isbn/9780316346627-L.jpg'
    ELSE cover_url
END,
updated_at = CURRENT_TIMESTAMP
WHERE deleted_at IS NULL;

UPDATE books
SET
    isbn = '9780062512796',
    cover_url = 'https://covers.openlibrary.org/b/isbn/9780062512796-L.jpg',
    updated_at = CURRENT_TIMESTAMP
WHERE deleted_at IS NULL
  AND isbn = '9780062502178';
