-- Remove remaining Google Books cover URLs that can render "image not available" placeholders.
-- Use direct product/library image URLs for Vietnamese catalog books.

UPDATE books
SET cover_url = CASE isbn
    WHEN '9786041140783' THEN 'https://product.hstatic.net/200000845405/product/mat_biec_bia_mem_in_lan_thu_44_c3bac57883a34d23aadcbdba843bbf36.jpg'
    WHEN '9786041218543' THEN 'https://cdn.hstatic.net/products/200000845405/nna-hvtcx_7d11d91c1a234851be621cd920aad300.jpg'
    WHEN '9786043947441' THEN 'https://product.hstatic.net/200000845405/product/p98091mt___t_____n_6b87e7c9f552429188b16db3aef03b5d.jpg'
    WHEN '9786043232653' THEN 'https://product.hstatic.net/200000845405/product/8936067604825_f163fe0819414858b4662eacd6817ce6.jpg'
    WHEN '9786048885083' THEN 'https://product.hstatic.net/200000845405/product/p96859mscreenshot_2022_10_05_131413_feb2d377d2414ef184b720028efe2c12.jpg'
    WHEN '9786041218628' THEN 'https://product.hstatic.net/200000845405/product/2410e2b33f6a496f02587d9ebcff2a2f_5cf2826ad8c54b138a14aa1c1cdad067.jpg'
    WHEN '9786041209718' THEN 'https://product.hstatic.net/200000845405/product/p96866m8934974179443_ee92554f0f034fcb84fbcc91c1e2e2e0.jpg'
    WHEN '9786043926248' THEN 'https://product.hstatic.net/200000845405/product/p94004mhanhtrinhvephuongdong2021_118k_01_6815c044a0064895ac333ea514fba40b.jpg'
    WHEN '9786048859718' THEN 'https://cdn.hstatic.net/products/200000845405/scan_20250514_074042_002_9ff70543a46246ceaf12db4171e70f47.jpg'
    WHEN '9786041219205' THEN 'https://product.hstatic.net/200000845405/product/copy_23_nxbtrestoryfull_26422016_00b4b3065ccb4a3ab2529e14f6cee12a.jpg'
    WHEN '9786047754903' THEN 'https://cdn.hstatic.net/products/200000845405/image_239651_1_a1ac93954d104e61a56bc3eca8754c2f.jpg'
    WHEN '9786041083622' THEN 'https://product.hstatic.net/200000845405/product/p96039m8934974178378_84871ce563704f0d9494e1a63b1a8b00.jpg'
    ELSE cover_url
END,
updated_at = CURRENT_TIMESTAMP
WHERE deleted_at IS NULL;
