-- Seed catalog data with Vietnamese content
-- Categories, Authors, Publishers, and Books

-- Get admin user ID for audit fields
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Retrieve admin user ID
    SELECT id INTO admin_user_id FROM users WHERE email = 'admin@bookstore.com' LIMIT 1;

    -- If admin user not found, raise error
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Admin user not found. Please ensure V3 migration has been executed.';
    END IF;

    -- Insert Categories
    INSERT INTO categories (name, description, created_by, updated_by) VALUES
    ('Văn học Việt Nam', 'Tác phẩm văn học của các tác giả Việt Nam, bao gồm tiểu thuyết, truyện ngắn, thơ ca', admin_user_id, admin_user_id),
    ('Lịch sử Việt Nam', 'Sách về lịch sử dân tộc Việt Nam qua các thời kỳ', admin_user_id, admin_user_id),
    ('Tiếng Việt', 'Sách học tiếng Việt, ngữ pháp, từ điển và tài liệu liên quan', admin_user_id, admin_user_id),
    ('Văn học nước ngoài', 'Tác phẩm văn học được dịch từ các tác giả quốc tế', admin_user_id, admin_user_id),
    ('Khoa học - Công nghệ', 'Sách về khoa học, công nghệ, lập trình, và kỹ thuật', admin_user_id, admin_user_id),
    ('Kinh tế - Quản lý', 'Sách về kinh tế, quản trị kinh doanh, tài chính', admin_user_id, admin_user_id),
    ('Thiếu nhi', 'Sách dành cho trẻ em và thiếu niên', admin_user_id, admin_user_id),
    ('Tâm lý - Kỹ năng sống', 'Sách về tâm lý học, phát triển bản thân, kỹ năng mềm', admin_user_id, admin_user_id),
    ('Triết học', 'Sách về triết học phương Đông và phương Tây', admin_user_id, admin_user_id),
    ('Nghệ thuật', 'Sách về hội họa, âm nhạc, điện ảnh và các loại hình nghệ thuật', admin_user_id, admin_user_id),
    ('Sách giáo khoa', 'Sách giáo khoa và tài liệu học tập các cấp', admin_user_id, admin_user_id),
    ('Truyện tranh', 'Truyện tranh Việt Nam và quốc tế', admin_user_id, admin_user_id);

    -- Insert Authors
    INSERT INTO authors (name, biography, created_by, updated_by) VALUES
    ('Nguyễn Nhật Ánh', 'Nhà văn nổi tiếng với các tác phẩm văn học thiếu nhi và thanh thiếu niên, tác giả của "Mắt biếc", "Tôi thấy hoa vàng trên cỏ xanh"', admin_user_id, admin_user_id),
    ('Ngô Tất Tố', 'Nhà văn hiện thực Việt Nam, tác giả tiểu thuyết "Tắt đèn" phản ánh thực trạng xã hội nông thôn đầu thế kỷ 20', admin_user_id, admin_user_id),
    ('Nam Cao', 'Nhà văn hiện thực lớn của Việt Nam, nổi tiếng với các tác phẩm "Chí Phèo", "Lão Hạc", "Sống mòn"', admin_user_id, admin_user_id),
    ('Tô Hoài', 'Nhà văn nổi tiếng với tác phẩm thiếu nhi "Dế Mèn phiêu lưu ký"', admin_user_id, admin_user_id),
    ('Nguyễn Du', 'Đại thi hào của Việt Nam, tác giả truyện thơ "Truyện Kiều" - kiệt tác văn học dân tộc', admin_user_id, admin_user_id),
    ('Hồ Chí Minh', 'Chủ tịch Hồ Chí Minh, lãnh tụ của dân tộc Việt Nam, tác giả nhiều tác phẩm về lịch sử và cách mạng', admin_user_id, admin_user_id),
    ('Vũ Trọng Phụng', 'Nhà văn hiện thực, nổi tiếng với phong cách châm biếm, tác giả "Số đỏ", "Dumb Luck"', admin_user_id, admin_user_id),
    ('Nguyễn Ngọc Tư', 'Nhà văn đương đại, tác giả "Cánh đồng bất tận", "Sông"', admin_user_id, admin_user_id),
    ('Nguyễn Bình Phương', 'Tác giả truyện thiếu nhi nổi tiếng với series "Hành trình về phương Đông"', admin_user_id, admin_user_id),
    ('Nguyễn Phong Việt', 'Tác giả sách kỹ năng sống và phát triển bản thân', admin_user_id, admin_user_id),
    ('Hà Mạnh Bảo', 'Nhà văn trẻ với các tác phẩm về tuổi trẻ và tình yêu', admin_user_id, admin_user_id),
    ('Anh Khang', 'Nhà văn trẻ với các truyện ngắn về đời sống đương đại', admin_user_id, admin_user_id),
    ('Nguyễn Huy Thiệp', 'Nhà văn đương đại với phong cách viết độc đáo, tác giả "Tướng về hưu"', admin_user_id, admin_user_id),
    ('Dương Thu Hương', 'Nhà văn nổi tiếng với các tác phẩm "Thiên đường mù", "Những thiên đường mù"', admin_user_id, admin_user_id),
    ('Paulo Coelho', 'Nhà văn người Brazil, tác giả "Nhà giả kim" - một trong những cuốn sách bán chạy nhất thế giới', admin_user_id, admin_user_id),
    ('Haruki Murakami', 'Nhà văn Nhật Bản nổi tiếng với phong cách siêu hiện thực, tác giả "Rừng Na Uy"', admin_user_id, admin_user_id),
    ('J.K. Rowling', 'Tác giả người Anh của series truyện Harry Potter nổi tiếng toàn cầu', admin_user_id, admin_user_id),
    ('Antoine de Saint-Exupéry', 'Nhà văn và phi công người Pháp, tác giả "Hoàng tử bé"', admin_user_id, admin_user_id);

    -- Insert Publishers
    INSERT INTO publishers (name, address, phone, email, created_by, updated_by) VALUES
    ('NXB Trẻ', '161B Lý Chính Thắng, Phường Võ Thị Sáu, Quận 3, TP.HCM', '(028) 39316289', 'info@nxbtre.com.vn', admin_user_id, admin_user_id),
    ('NXB Kim Đồng', '55 Quang Trung, Nguyễn Du, Hai Bà Trưng, Hà Nội', '(024) 39434730', 'info@kimdong.com.vn', admin_user_id, admin_user_id),
    ('NXB Giáo dục Việt Nam', '81 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội', '(024) 38220801', 'info@nxbgd.vn', admin_user_id, admin_user_id),
    ('NXB Văn học', '18 Nguyễn Trường Tộ, Ba Đình, Hà Nội', '(024) 38223900', 'info@nxbvanhoc.com.vn', admin_user_id, admin_user_id),
    ('NXB Lao động', '175 Giảng Võ, Đống Đa, Hà Nội', '(024) 38515380', 'info@nxblaodong.com.vn', admin_user_id, admin_user_id),
    ('NXB Hội Nhà văn', '65 Nguyễn Du, Hai Bà Trưng, Hà Nội', '(024) 38222135', 'info@nxbhoinv.vn', admin_user_id, admin_user_id),
    ('NXB Phụ nữ', '39 Hàng Chuối, Hai Bà Trưng, Hà Nội', '(024) 39714046', 'info@nxbphunu.com.vn', admin_user_id, admin_user_id),
    ('NXB Tổng hợp TP.HCM', '62 Nguyễn Thị Minh Khai, Quận 1, TP.HCM', '(028) 38225340', 'info@nxbhcm.com.vn', admin_user_id, admin_user_id),
    ('NXB Chính trị Quốc gia', '7 Nguyễn Thái Học, Ba Đình, Hà Nội', '(024) 38252361', 'info@nxbctqg.vn', admin_user_id, admin_user_id);

    -- Insert Books
    INSERT INTO books (category_id, author_id, publisher_id, title, isbn, publication_year, price, stock_quantity, description, business_status, storage_location, created_by, updated_by)
    SELECT
        (SELECT id FROM categories WHERE name = 'Văn học Việt Nam'),
        (SELECT id FROM authors WHERE name = 'Nguyễn Nhật Ánh'),
        (SELECT id FROM publishers WHERE name = 'NXB Trẻ'),
        'Mắt biếc', '9786041000015', 2010, 85000, 45,
        'Câu chuyện tình yêu thuần khiết của Ngạn dành cho Hà Lan, một tác phẩm đầy cảm xúc về tuổi thơ và tình đầu',
        'ACTIVE', 'Kho A-Kệ 1-Ngăn 2', admin_user_id, admin_user_id
    UNION ALL SELECT
        (SELECT id FROM categories WHERE name = 'Văn học Việt Nam'),
        (SELECT id FROM authors WHERE name = 'Nguyễn Nhật Ánh'),
        (SELECT id FROM publishers WHERE name = 'NXB Trẻ'),
        'Tôi thấy hoa vàng trên cỏ xanh', '9786041000022', 2010, 95000, 38,
        'Câu chuyện về tuổi thơ của hai anh em Thiều và Tường tại một vùng quê Việt Nam',
        'ACTIVE', 'Kho A-Kệ 1-Ngăn 3', admin_user_id, admin_user_id
    UNION ALL SELECT
        (SELECT id FROM categories WHERE name = 'Văn học Việt Nam'),
        (SELECT id FROM authors WHERE name = 'Ngô Tất Tố'),
        (SELECT id FROM publishers WHERE name = 'NXB Văn học'),
        'Tắt đèn', '9786042000018', 2015, 65000, 52,
        'Tiểu thuyết hiện thực phê phán về thực trạng nông thôn Việt Nam đầu thế kỷ 20',
        'ACTIVE', 'Kho A-Kệ 2-Ngăn 1', admin_user_id, admin_user_id
    UNION ALL SELECT
        (SELECT id FROM categories WHERE name = 'Văn học Việt Nam'),
        (SELECT id FROM authors WHERE name = 'Nam Cao'),
        (SELECT id FROM publishers WHERE name = 'NXB Văn học'),
        'Chí Phèo', '9786042000025', 2016, 55000, 60,
        'Truyện ngắn nổi tiếng về số phận bi thảm của người nông dân nghèo khổ',
        'ACTIVE', 'Kho A-Kệ 2-Ngăn 2', admin_user_id, admin_user_id
    UNION ALL SELECT
        (SELECT id FROM categories WHERE name = 'Thiếu nhi'),
        (SELECT id FROM authors WHERE name = 'Tô Hoài'),
        (SELECT id FROM publishers WHERE name = 'NXB Kim Đồng'),
        'Dế Mèn phiêu lưu ký', '9786043000011', 2014, 78000, 67,
        'Tác phẩm văn học thiếu nhi kinh điển kể về cuộc phiêu lưu của chú Dế Mèn',
        'ACTIVE', 'Kho B-Kệ 1-Ngăn 1', admin_user_id, admin_user_id
    UNION ALL SELECT
        (SELECT id FROM categories WHERE name = 'Văn học Việt Nam'),
        (SELECT id FROM authors WHERE name = 'Nguyễn Du'),
        (SELECT id FROM publishers WHERE name = 'NXB Văn học'),
        'Truyện Kiều', '9786042000032', 2018, 120000, 35,
        'Truyện thơ bất hủ của đại thi hào Nguyễn Du, kiệt tác văn học Việt Nam',
        'ACTIVE', 'Kho A-Kệ 2-Ngăn 3', admin_user_id, admin_user_id
    UNION ALL SELECT
        (SELECT id FROM categories WHERE name = 'Lịch sử Việt Nam'),
        (SELECT id FROM authors WHERE name = 'Hồ Chí Minh'),
        (SELECT id FROM publishers WHERE name = 'NXB Chính trị Quốc gia'),
        'Nhật ký trong tù', '9786044000014', 2019, 95000, 28,
        'Tập thơ của Chủ tịch Hồ Chí Minh viết trong thời gian bị giam giữ',
        'ACTIVE', 'Kho C-Kệ 1-Ngăn 1', admin_user_id, admin_user_id
    UNION ALL SELECT
        (SELECT id FROM categories WHERE name = 'Văn học Việt Nam'),
        (SELECT id FROM authors WHERE name = 'Vũ Trọng Phụng'),
        (SELECT id FROM publishers WHERE name = 'NXB Hội Nhà văn'),
        'Số đỏ', '9786045000017', 2017, 88000, 42,
        'Tiểu thuyết châm biếm về xã hội Hà Nội thập niên 1930',
        'ACTIVE', 'Kho A-Kệ 3-Ngăn 1', admin_user_id, admin_user_id
    UNION ALL SELECT
        (SELECT id FROM categories WHERE name = 'Văn học Việt Nam'),
        (SELECT id FROM authors WHERE name = 'Nguyễn Ngọc Tư'),
        (SELECT id FROM publishers WHERE name = 'NXB Trẻ'),
        'Cánh đồng bất tận', '9786041000039', 2012, 92000, 31,
        'Truyện ngắn về cuộc sống vùng đồng bằng sông Cửu Long',
        'ACTIVE', 'Kho A-Kệ 3-Ngăn 2', admin_user_id, admin_user_id
    UNION ALL SELECT
        (SELECT id FROM categories WHERE name = 'Văn học Việt Nam'),
        (SELECT id FROM authors WHERE name = 'Nguyễn Huy Thiệp'),
        (SELECT id FROM publishers WHERE name = 'NXB Hội Nhà văn'),
        'Tướng về hưu', '9786045000024', 2015, 75000, 0,
        'Truyện ngắn về một vị tướng về hưu và những trăn trở của ông',
        'OUT_OF_STOCK', 'Kho A-Kệ 3-Ngăn 3', admin_user_id, admin_user_id
    UNION ALL SELECT
        (SELECT id FROM categories WHERE name = 'Thiếu nhi'),
        (SELECT id FROM authors WHERE name = 'Nguyễn Bình Phương'),
        (SELECT id FROM publishers WHERE name = 'NXB Kim Đồng'),
        'Hành trình về phương Đông', '9786043000028', 2016, 125000, 44,
        'Series phiêu lưu kỳ ảo dành cho thiếu nhi về hành trình khám phá phương Đông',
        'ACTIVE', 'Kho B-Kệ 1-Ngăn 2', admin_user_id, admin_user_id
    UNION ALL SELECT
        (SELECT id FROM categories WHERE name = 'Thiếu nhi'),
        (SELECT id FROM authors WHERE name = 'Antoine de Saint-Exupéry'),
        (SELECT id FROM publishers WHERE name = 'NXB Kim Đồng'),
        'Hoàng tử bé', '9786043000035', 2018, 68000, 55,
        'Tác phẩm kinh điển thế giới về cậu bé đến từ tiểu hành tinh B-612',
        'ACTIVE', 'Kho B-Kệ 1-Ngăn 3', admin_user_id, admin_user_id
    UNION ALL SELECT
        (SELECT id FROM categories WHERE name = 'Truyện tranh'),
        (SELECT id FROM authors WHERE name = 'J.K. Rowling'),
        (SELECT id FROM publishers WHERE name = 'NXB Trẻ'),
        'Harry Potter và Hòn đá phù thủy', '9786041000046', 2020, 185000, 72,
        'Phần đầu tiên của series Harry Potter nổi tiếng toàn cầu',
        'ACTIVE', 'Kho B-Kệ 2-Ngăn 1', admin_user_id, admin_user_id
    UNION ALL SELECT
        (SELECT id FROM categories WHERE name = 'Văn học nước ngoài'),
        (SELECT id FROM authors WHERE name = 'Paulo Coelho'),
        (SELECT id FROM publishers WHERE name = 'NXB Lao động'),
        'Nhà giả kim', '9786046000010', 2013, 79000, 48,
        'Câu chuyện về chàng chăn cừu Santiago trong hành trình tìm kiếm kho báu và ý nghĩa cuộc sống',
        'ACTIVE', 'Kho A-Kệ 4-Ngăn 1', admin_user_id, admin_user_id
    UNION ALL SELECT
        (SELECT id FROM categories WHERE name = 'Văn học nước ngoài'),
        (SELECT id FROM authors WHERE name = 'Haruki Murakami'),
        (SELECT id FROM publishers WHERE name = 'NXB Hội Nhà văn'),
        'Rừng Na Uy', '9786045000031', 2014, 135000, 29,
        'Tiểu thuyết nổi tiếng của Murakami về tình yêu và tuổi trẻ',
        'ACTIVE', 'Kho A-Kệ 4-Ngăn 2', admin_user_id, admin_user_id
    UNION ALL SELECT
        (SELECT id FROM categories WHERE name = 'Tâm lý - Kỹ năng sống'),
        (SELECT id FROM authors WHERE name = 'Nguyễn Phong Việt'),
        (SELECT id FROM publishers WHERE name = 'NXB Lao động'),
        'Đắc nhân tâm', '9786046000027', 2015, 88000, 65,
        'Bản dịch tiếng Việt của tác phẩm "How to Win Friends and Influence People" của Dale Carnegie',
        'ACTIVE', 'Kho D-Kệ 1-Ngăn 1', admin_user_id, admin_user_id
    UNION ALL SELECT
        (SELECT id FROM categories WHERE name = 'Tâm lý - Kỹ năng sống'),
        (SELECT id FROM authors WHERE name = 'Nguyễn Phong Việt'),
        (SELECT id FROM publishers WHERE name = 'NXB Trẻ'),
        'Tuổi trẻ đáng giá bao nhiêu', '9786041000053', 2017, 75000, 58,
        'Sách về phát triển bản thân và định hướng cho tuổi trẻ',
        'ACTIVE', 'Kho D-Kệ 1-Ngăn 2', admin_user_id, admin_user_id
    UNION ALL SELECT
        (SELECT id FROM categories WHERE name = 'Nghệ thuật'),
        (SELECT id FROM authors WHERE name = 'Hà Mạnh Bảo'),
        (SELECT id FROM publishers WHERE name = 'NXB Phụ nữ'),
        'Nghệ thuật sống tối giản', '9786047000013', 2019, 98000, 33,
        'Sách về triết lý sống tối giản và nghệ thuật sắp xếp không gian sống',
        'ACTIVE', 'Kho D-Kệ 2-Ngăn 1', admin_user_id, admin_user_id
    UNION ALL SELECT
        (SELECT id FROM categories WHERE name = 'Kinh tế - Quản lý'),
        (SELECT id FROM authors WHERE name = 'Anh Khang'),
        (SELECT id FROM publishers WHERE name = 'NXB Tổng hợp TP.HCM'),
        'Khởi nghiệp từ con số 0', '9786048000016', 2018, 145000, 0,
        'Hướng dẫn khởi nghiệp và xây dựng doanh nghiệp từ đầu',
        'OUT_OF_STOCK', 'Kho E-Kệ 1-Ngăn 1', admin_user_id, admin_user_id
    UNION ALL SELECT
        (SELECT id FROM categories WHERE name = 'Khoa học - Công nghệ'),
        (SELECT id FROM authors WHERE name = 'Nguyễn Nhật Ánh'),
        (SELECT id FROM publishers WHERE name = 'NXB Trẻ'),
        'Có hai con mèo ngồi bên cửa sổ', '9786041000060', 2016, 82000, 41,
        'Tác phẩm kể về thế giới khoa học qua con mắt của trẻ em',
        'ACTIVE', 'Kho E-Kệ 2-Ngăn 1', admin_user_id, admin_user_id
    UNION ALL SELECT
        (SELECT id FROM categories WHERE name = 'Sách giáo khoa'),
        (SELECT id FROM authors WHERE name = 'Dương Thu Hương'),
        (SELECT id FROM publishers WHERE name = 'NXB Giáo dục Việt Nam'),
        'Ngữ văn 10 - Tập 1', '9786049000019', 2020, 45000, 120,
        'Sách giáo khoa Ngữ văn lớp 10 theo chương trình mới',
        'ACTIVE', 'Kho F-Kệ 1-Ngăn 1', admin_user_id, admin_user_id
    UNION ALL SELECT
        (SELECT id FROM categories WHERE name = 'Sách giáo khoa'),
        (SELECT id FROM authors WHERE name = 'Dương Thu Hương'),
        (SELECT id FROM publishers WHERE name = 'NXB Giáo dục Việt Nam'),
        'Ngữ văn 11 - Tập 1', '9786049000026', 2021, 48000, 95,
        'Sách giáo khoa Ngữ văn lớp 11 theo chương trình mới',
        'ACTIVE', 'Kho F-Kệ 1-Ngăn 2', admin_user_id, admin_user_id
    UNION ALL SELECT
        (SELECT id FROM categories WHERE name = 'Triết học'),
        (SELECT id FROM authors WHERE name = 'Hồ Chí Minh'),
        (SELECT id FROM publishers WHERE name = 'NXB Chính trị Quốc gia'),
        'Tư tưởng Hồ Chí Minh', '9786044000021', 2020, 115000, 37,
        'Tuyển tập về tư tưởng và triết lý của Chủ tịch Hồ Chí Minh',
        'ACTIVE', 'Kho C-Kệ 1-Ngăn 2', admin_user_id, admin_user_id
    UNION ALL SELECT
        (SELECT id FROM categories WHERE name = 'Tiếng Việt'),
        (SELECT id FROM authors WHERE name = 'Nam Cao'),
        (SELECT id FROM publishers WHERE name = 'NXB Giáo dục Việt Nam'),
        'Từ điển Tiếng Việt thông dụng', '9786049000033', 2019, 250000, 22,
        'Từ điển tiếng Việt đầy đủ với hơn 50,000 từ ngữ',
        'ACTIVE', 'Kho F-Kệ 2-Ngăn 1', admin_user_id, admin_user_id
    UNION ALL SELECT
        (SELECT id FROM categories WHERE name = 'Tiếng Việt'),
        (SELECT id FROM authors WHERE name = 'Ngô Tất Tố'),
        (SELECT id FROM publishers WHERE name = 'NXB Giáo dục Việt Nam'),
        'Ngữ pháp Tiếng Việt thực hành', '9786049000040', 2018, 135000, 18,
        'Sách hướng dẫn ngữ pháp tiếng Việt với nhiều bài tập thực hành',
        'ACTIVE', 'Kho F-Kệ 2-Ngăn 2', admin_user_id, admin_user_id;

END $$;
