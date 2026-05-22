-- PostgreSQL is the source of truth for book catalog metadata.
-- This migration replaces placeholder ISBNs with real ISBN/EAN values, stores real cover URLs,
-- and imports the Neo4j-only graph sample books into the catalog so both stores stay aligned.

ALTER TABLE books ADD COLUMN IF NOT EXISTS cover_url TEXT;

CREATE TEMP TABLE normalized_book_catalog (
    match_title TEXT NOT NULL,
    title TEXT NOT NULL,
    isbn VARCHAR(13) NOT NULL,
    publication_year INT NOT NULL,
    price DECIMAL(18,2) NOT NULL,
    stock_quantity INT NOT NULL,
    description TEXT,
    business_status VARCHAR(50) NOT NULL,
    storage_location VARCHAR(100),
    author_name TEXT NOT NULL,
    category_name TEXT NOT NULL,
    publisher_name TEXT NOT NULL,
    cover_url TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO normalized_book_catalog (
    match_title, title, isbn, publication_year, price, stock_quantity, description,
    business_status, storage_location, author_name, category_name, publisher_name, cover_url
) VALUES
('Mắt biếc', 'Mắt biếc', '9786041140783', 2010, 85000, 45, 'Câu chuyện tình yêu thuần khiết của Ngạn dành cho Hà Lan, một tác phẩm đầy cảm xúc về tuổi thơ và tình đầu', 'ACTIVE', 'Kho A-Kệ 1-Ngăn 2', 'Nguyễn Nhật Ánh', 'Văn học Việt Nam', 'NXB Trẻ', 'https://books.google.com/books/content?id=ngmRzQEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api'),
('Tôi thấy hoa vàng trên cỏ xanh', 'Tôi thấy hoa vàng trên cỏ xanh', '9786041218543', 2010, 95000, 38, 'Câu chuyện về tuổi thơ của hai anh em Thiều và Tường tại một vùng quê Việt Nam', 'ACTIVE', 'Kho A-Kệ 1-Ngăn 3', 'Nguyễn Nhật Ánh', 'Văn học Việt Nam', 'NXB Trẻ', 'https://books.google.com/books/content?id=dw1l0AEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api'),
('Tắt đèn', 'Tắt đèn', '9786043947441', 2015, 65000, 52, 'Tiểu thuyết hiện thực phê phán về thực trạng nông thôn Việt Nam đầu thế kỷ 20', 'ACTIVE', 'Kho A-Kệ 2-Ngăn 1', 'Ngô Tất Tố', 'Văn học Việt Nam', 'NXB Văn học', 'https://books.google.com/books/content?id=ufAD0QEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api'),
('Chí Phèo', 'Chí Phèo', '9786043232653', 2016, 55000, 60, 'Truyện ngắn nổi tiếng về số phận bi thảm của người nông dân nghèo khổ', 'ACTIVE', 'Kho A-Kệ 2-Ngăn 2', 'Nam Cao', 'Văn học Việt Nam', 'NXB Văn học', 'https://books.google.com/books/content?id=Myns0AEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api'),
('Dế Mèn phiêu lưu ký', 'Dế Mèn phiêu lưu ký', '9786042125345', 2014, 78000, 67, 'Tác phẩm văn học thiếu nhi kinh điển kể về cuộc phiêu lưu của chú Dế Mèn', 'ACTIVE', 'Kho B-Kệ 1-Ngăn 1', 'Tô Hoài', 'Thiếu nhi', 'NXB Kim Đồng', 'https://books.google.com/books/content?id=-xY1yQEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api'),
('Truyện Kiều', 'Truyện Kiều', '9786048885083', 2018, 120000, 35, 'Truyện thơ bất hủ của đại thi hào Nguyễn Du, kiệt tác văn học Việt Nam', 'ACTIVE', 'Kho A-Kệ 2-Ngăn 3', 'Nguyễn Du', 'Văn học Việt Nam', 'NXB Văn học', 'https://books.google.com/books/content?id=Weo2EQAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api'),
('Nhật ký trong tù', 'Nhật ký trong tù', '9786043494860', 2019, 95000, 28, 'Tập thơ chữ Hán của Chủ tịch Hồ Chí Minh được sáng tác trong thời gian bị giam cầm', 'ACTIVE', 'Kho C-Kệ 1-Ngăn 1', 'Hồ Chí Minh', 'Lịch sử Việt Nam', 'NXB Chính trị Quốc gia', 'https://books.google.com/books/content?vid=ISBN9786043494860&printsec=frontcover&img=1&zoom=1'),
('Số đỏ', 'Số đỏ', '9786044913704', 2017, 70000, 44, 'Tiểu thuyết châm biếm sắc sảo về xã hội thành thị Việt Nam thời thuộc địa', 'ACTIVE', 'Kho A-Kệ 3-Ngăn 1', 'Vũ Trọng Phụng', 'Văn học Việt Nam', 'Sbooks', 'https://books.google.com/books/content?vid=ISBN9786044913704&printsec=frontcover&img=1&zoom=1'),
('Cánh đồng bất tận', 'Cánh đồng bất tận', '9786041218628', 2015, 88000, 41, 'Tập truyện ngắn của Nguyễn Ngọc Tư về cuộc sống miền Tây Nam Bộ', 'ACTIVE', 'Kho A-Kệ 3-Ngăn 2', 'Nguyễn Ngọc Tư', 'Văn học Việt Nam', 'NXB Trẻ', 'https://books.google.com/books/content?id=gBhA0AEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api'),
('Tướng về hưu', 'Tướng về hưu & những truyện khác', '9786041209718', 2022, 158000, 0, 'Tập truyện ngắn tiêu biểu của Nguyễn Huy Thiệp, trong đó có Tướng về hưu', 'OUT_OF_STOCK', 'Kho A-Kệ 3-Ngăn 3', 'Nguyễn Huy Thiệp', 'Văn học Việt Nam', 'NXB Trẻ', 'https://books.google.com/books/content?id=3BCIzwEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api'),
('Hành trình về phương Đông', 'Hành trình về phương Đông', '9786043926248', 2023, 99000, 33, 'Tác phẩm kể lại hành trình khám phá minh triết phương Đông', 'ACTIVE', 'Kho D-Kệ 1-Ngăn 1', 'Blair T. Spalding', 'Triết học', 'NXB Hồng Đức', 'https://books.google.com/books/content?id=fKSY0AEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api'),
('Hoàng tử bé', 'Hoàng tử bé', '9786048859718', 2019, 69000, 56, 'Tác phẩm kinh điển về tình bạn, tình yêu và cách nhìn thế giới bằng trái tim', 'ACTIVE', 'Kho D-Kệ 1-Ngăn 2', 'Antoine de Saint-Exupéry', 'Văn học nước ngoài', 'NXB Văn học', 'https://books.google.com/books/content?id=ZH3dvQEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api'),
('Harry Potter và Hòn đá phù thủy', 'Harry Potter và Hòn đá phù thủy', '9786041219205', 2024, 150000, 72, 'Tập đầu tiên trong series Harry Potter, mở ra thế giới phù thủy Hogwarts', 'ACTIVE', 'Kho D-Kệ 2-Ngăn 1', 'J.K. Rowling', 'Văn học nước ngoài', 'NXB Trẻ', 'https://books.google.com/books/content?id=uEI30AEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api'),
('Nhà giả kim', 'Nhà giả kim', '9780062315007', 1988, 89000, 85, 'Câu chuyện ngụ ngôn hiện đại về Santiago và hành trình đi tìm kho báu của đời mình', 'ACTIVE', 'Kho D-Kệ 2-Ngăn 2', 'Paulo Coelho', 'Văn học nước ngoài', 'HarperOne', 'https://books.google.com/books/content?vid=ISBN9780062315007&printsec=frontcover&img=1&zoom=1'),
('Rừng Na Uy', 'Rừng Na Uy', '9786049570735', 2018, 125000, 27, 'Tiểu thuyết nổi tiếng của Haruki Murakami về ký ức, tình yêu và mất mát', 'ACTIVE', 'Kho D-Kệ 2-Ngăn 3', 'Haruki Murakami', 'Văn học nước ngoài', 'NXB Hội Nhà văn', 'https://books.google.com/books/content?vid=ISBN9786049570735&printsec=frontcover&img=1&zoom=1'),
('Đắc nhân tâm', 'Đắc nhân tâm', '9780671027032', 1936, 89000, 94, 'Cuốn sách kinh điển về nghệ thuật giao tiếp và tạo ảnh hưởng tích cực', 'ACTIVE', 'Kho E-Kệ 1-Ngăn 1', 'Dale Carnegie', 'Tâm lý - Kỹ năng sống', 'Simon & Schuster', 'https://books.google.com/books/content?vid=ISBN9780671027032&printsec=frontcover&img=1&zoom=1'),
('Tuổi trẻ đáng giá bao nhiêu', 'Tuổi trẻ đáng giá bao nhiêu', '9786047754903', 2016, 90000, 64, 'Cuốn sách truyền cảm hứng cho người trẻ về học tập, trải nghiệm và trưởng thành', 'ACTIVE', 'Kho E-Kệ 1-Ngăn 2', 'Rosie Nguyễn', 'Tâm lý - Kỹ năng sống', 'NXB Hội Nhà văn', 'https://books.google.com/books/content?id=iCQytAEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api'),
('Nghệ thuật sống tối giản', 'Nghệ thuật tối giản', '9786048922283', 2018, 86000, 39, 'Những gợi ý thực tế để sống giản dị, tinh gọn và tập trung hơn', 'ACTIVE', 'Kho E-Kệ 1-Ngăn 3', 'Dominique Loreau', 'Tâm lý - Kỹ năng sống', 'Saigon Books', 'https://books.google.com/books/content?vid=ISBN9786048922283&printsec=frontcover&img=1&zoom=1'),
('Khởi nghiệp từ con số 0', 'Thách thức từ con số 0', '9786045933329', 2015, 110000, 0, 'Những triết lý kinh doanh và khởi nghiệp từ trải nghiệm của Kazuo Inamori', 'OUT_OF_STOCK', 'Kho E-Kệ 2-Ngăn 1', 'Kazuo Inamori', 'Kinh tế - Quản lý', 'NXB Lao động', 'https://books.google.com/books/content?vid=ISBN9786045933329&printsec=frontcover&img=1&zoom=1'),
('Có hai con mèo ngồi bên cửa sổ', 'Có hai con mèo ngồi bên cửa sổ', '9786041083622', 2016, 78000, 47, 'Một truyện dài nhẹ nhàng, dí dỏm của Nguyễn Nhật Ánh về tình bạn và tuổi thơ', 'ACTIVE', 'Kho B-Kệ 1-Ngăn 2', 'Nguyễn Nhật Ánh', 'Thiếu nhi', 'NXB Trẻ', 'https://books.google.com/books/content?id=tD-LzwEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api'),
('Ngữ văn 10 - Tập 1', 'Ngữ văn 10 - Tập 1', '9786040320179', 2022, 22000, 120, 'Sách giáo khoa Ngữ văn lớp 10 tập 1', 'ACTIVE', 'Kho F-Kệ 1-Ngăn 1', 'Nhiều Tác Giả', 'Sách giáo khoa', 'NXB Giáo dục Việt Nam', 'https://books.google.com/books/content?vid=ISBN9786040320179&printsec=frontcover&img=1&zoom=1'),
('Ngữ văn 11 - Tập 1', 'Ngữ văn 11 - Tập 1', '9786040351999', 2023, 25000, 115, 'Sách giáo khoa Ngữ văn lớp 11 tập 1', 'ACTIVE', 'Kho F-Kệ 1-Ngăn 2', 'Nhiều Tác Giả', 'Sách giáo khoa', 'NXB Giáo dục Việt Nam', 'https://books.google.com/books/content?vid=ISBN9786040351999&printsec=frontcover&img=1&zoom=1'),
('Tư tưởng Hồ Chí Minh', 'Giáo trình Tư tưởng Hồ Chí Minh', '9786045798102', 2024, 115000, 37, 'Giáo trình về cơ sở, quá trình hình thành và phát triển tư tưởng Hồ Chí Minh', 'ACTIVE', 'Kho C-Kệ 1-Ngăn 2', 'Mạch Quang Thắng', 'Triết học', 'NXB Chính trị Quốc gia', 'https://books.google.com/books/content?vid=ISBN9786045798102&printsec=frontcover&img=1&zoom=1'),
('Từ điển Tiếng Việt thông dụng', 'Từ điển Tiếng Việt thông dụng', '9786048871437', 2025, 250000, 22, 'Từ điển tiếng Việt thông dụng phục vụ học tập và tra cứu hằng ngày', 'ACTIVE', 'Kho F-Kệ 2-Ngăn 1', 'Thành Yến', 'Tiếng Việt', 'NXB Dân Trí', 'https://books.google.com/books/content?vid=ISBN9786048871437&printsec=frontcover&img=1&zoom=1'),
('Ngữ pháp Tiếng Việt thực hành', 'Ngữ pháp Tiếng Việt thực hành', '9786043046410', 2020, 135000, 18, 'Sách hướng dẫn ngữ pháp tiếng Việt với nhiều bài tập thực hành', 'ACTIVE', 'Kho F-Kệ 2-Ngăn 2', 'Nguyễn Quang', 'Tiếng Việt', 'NXB Dân Trí', 'https://books.google.com/books/content?vid=ISBN9786043046410&printsec=frontcover&img=1&zoom=1'),

('1984', '1984', '9780451524935', 1949, 99000, 70, 'Tiểu thuyết phản địa đàng kinh điển của George Orwell về giám sát và quyền lực toàn trị', 'ACTIVE', 'Kho G-Kệ 1-Ngăn 1', 'George Orwell', 'Văn học nước ngoài', 'Signet Classic', 'https://books.google.com/books/content?vid=ISBN9780451524935&printsec=frontcover&img=1&zoom=1'),
('7 Thói Quen Hiệu Quả', '7 Thói Quen Hiệu Quả', '9780743269513', 1989, 115000, 64, 'Bảy thói quen nền tảng giúp phát triển hiệu quả cá nhân và lãnh đạo', 'ACTIVE', 'Kho E-Kệ 3-Ngăn 1', 'Stephen Covey', 'Tâm lý - Kỹ năng sống', 'Simon & Schuster', 'https://books.google.com/books/content?vid=ISBN9780743269513&printsec=frontcover&img=1&zoom=1'),
('Atomic Habits', 'Atomic Habits', '9780735211292', 2018, 129000, 80, 'Phương pháp xây dựng thói quen nhỏ tạo ra kết quả lớn trong dài hạn', 'ACTIVE', 'Kho E-Kệ 3-Ngăn 2', 'James Clear', 'Tâm lý - Kỹ năng sống', 'Avery', 'https://books.google.com/books/content?vid=ISBN9780735211292&printsec=frontcover&img=1&zoom=1'),
('Binh Pháp Tôn Tử', 'Binh Pháp Tôn Tử', '9780140455526', 2009, 78000, 42, 'Tác phẩm kinh điển về chiến lược, tư duy cạnh tranh và nghệ thuật lãnh đạo', 'ACTIVE', 'Kho C-Kệ 2-Ngăn 1', 'Tôn Tử', 'Triết học', 'Penguin Classics', 'https://books.google.com/books/content?vid=ISBN9780140455526&printsec=frontcover&img=1&zoom=1'),
('Bắt Đầu Với Câu Hỏi Tại Sao', 'Bắt Đầu Với Câu Hỏi Tại Sao', '9781591846444', 2009, 119000, 53, 'Simon Sinek lý giải cách các nhà lãnh đạo truyền cảm hứng bắt đầu từ lý do tồn tại', 'ACTIVE', 'Kho E-Kệ 3-Ngăn 3', 'Simon Sinek', 'Kinh tế - Quản lý', 'Portfolio', 'https://books.google.com/books/content?vid=ISBN9781591846444&printsec=frontcover&img=1&zoom=1'),
('Cha Giàu Cha Nghèo', 'Cha Giàu Cha Nghèo', '9781612680194', 1997, 109000, 76, 'Cuốn sách tài chính cá nhân kinh điển về tư duy tài sản, nợ và tự do tài chính', 'ACTIVE', 'Kho E-Kệ 4-Ngăn 1', 'Robert T. Kiyosaki', 'Kinh tế - Quản lý', 'Plata Publishing', 'https://books.google.com/books/content?vid=ISBN9781612680194&printsec=frontcover&img=1&zoom=1'),
('Homo Deus', 'Homo Deus', '9780062464316', 2016, 169000, 34, 'Yuval Noah Harari bàn về tương lai của loài người trong kỷ nguyên dữ liệu và công nghệ', 'ACTIVE', 'Kho G-Kệ 1-Ngăn 2', 'Yuval Noah Harari', 'Khoa học - Công nghệ', 'Harper', 'https://books.google.com/books/content?vid=ISBN9780062464316&printsec=frontcover&img=1&zoom=1'),
('Khởi Nghiệp Tinh Gọn', 'Khởi Nghiệp Tinh Gọn', '9780307887894', 2011, 139000, 45, 'Phương pháp Lean Startup giúp thử nghiệm, học hỏi và phát triển sản phẩm nhanh hơn', 'ACTIVE', 'Kho E-Kệ 4-Ngăn 2', 'Eric Ries', 'Kinh tế - Quản lý', 'Currency', 'https://books.google.com/books/content?vid=ISBN9780307887894&printsec=frontcover&img=1&zoom=1'),
('Làm Việc Sâu', 'Làm Việc Sâu', '9781455586691', 2016, 135000, 51, 'Cal Newport trình bày phương pháp tập trung sâu để tạo ra thành quả có giá trị cao', 'ACTIVE', 'Kho E-Kệ 4-Ngăn 3', 'Cal Newport', 'Tâm lý - Kỹ năng sống', 'Grand Central Publishing', 'https://books.google.com/books/content?vid=ISBN9781455586691&printsec=frontcover&img=1&zoom=1'),
('Lược Sử Thời Gian', 'Lược Sử Thời Gian', '9780553380163', 1988, 125000, 30, 'Stephen Hawking giới thiệu các câu hỏi lớn về vũ trụ, thời gian và vật lý hiện đại', 'ACTIVE', 'Kho G-Kệ 2-Ngăn 1', 'Stephen Hawking', 'Khoa học - Công nghệ', 'Bantam', 'https://books.google.com/books/content?vid=ISBN9780553380163&printsec=frontcover&img=1&zoom=1'),
('Nghĩ Giàu Làm Giàu', 'Nghĩ Giàu Làm Giàu', '9781585424337', 1937, 105000, 68, 'Napoleon Hill tổng hợp các nguyên tắc tư duy thành công và tạo dựng tài sản', 'ACTIVE', 'Kho E-Kệ 5-Ngăn 1', 'Napoleon Hill', 'Kinh tế - Quản lý', 'TarcherPerigee', 'https://books.google.com/books/content?vid=ISBN9781585424337&printsec=frontcover&img=1&zoom=1'),
('Nghệ Thuật Tinh Tế Của Việc Đếch Quan Tâm', 'Nghệ Thuật Tinh Tế Của Việc Đếch Quan Tâm', '9780062457714', 2016, 118000, 59, 'Mark Manson viết về cách chọn điều đáng quan tâm để sống tự do và tỉnh táo hơn', 'ACTIVE', 'Kho E-Kệ 5-Ngăn 2', 'Mark Manson', 'Tâm lý - Kỹ năng sống', 'HarperOne', 'https://books.google.com/books/content?vid=ISBN9780062457714&printsec=frontcover&img=1&zoom=1'),
('Nhà Giả Kim 2 - Người Hành Hướng', 'Người hành hương', '9780062502178', 1987, 79000, 44, 'Một hành trình tâm linh của Paulo Coelho trên con đường hành hương Santiago', 'ACTIVE', 'Kho D-Kệ 3-Ngăn 1', 'Paulo Coelho', 'Văn học nước ngoài', 'HarperOne', 'https://books.google.com/books/content?vid=ISBN9780062502178&printsec=frontcover&img=1&zoom=1'),
('Những Kẻ Xuất Chúng', 'Những Kẻ Xuất Chúng', '9780316017930', 2008, 129000, 62, 'Malcolm Gladwell phân tích những yếu tố văn hóa, thời điểm và luyện tập tạo nên thành công vượt trội', 'ACTIVE', 'Kho E-Kệ 5-Ngăn 3', 'Malcolm Gladwell', 'Kinh tế - Quản lý', 'Little, Brown and Company', 'https://books.google.com/books/content?vid=ISBN9780316017930&printsec=frontcover&img=1&zoom=1'),
('Sapiens', 'Sapiens', '9780062316097', 2014, 179000, 71, 'Lược sử loài người qua các cuộc cách mạng nhận thức, nông nghiệp và khoa học', 'ACTIVE', 'Kho G-Kệ 2-Ngăn 2', 'Yuval Noah Harari', 'Khoa học - Công nghệ', 'Harper', 'https://books.google.com/books/content?vid=ISBN9780062316097&printsec=frontcover&img=1&zoom=1'),
('Sức Mạnh Của Hiện Tại', 'Sức Mạnh Của Hiện Tại', '9781577314806', 1997, 99000, 48, 'Eckhart Tolle hướng dẫn thực hành tỉnh thức và sống trọn vẹn với hiện tại', 'ACTIVE', 'Kho C-Kệ 2-Ngăn 2', 'Eckhart Tolle', 'Triết học', 'New World Library', 'https://books.google.com/books/content?vid=ISBN9781577314806&printsec=frontcover&img=1&zoom=1'),
('Thiền Định - Marcus Aurelius', 'Thiền Định', '9780812968255', 2003, 88000, 40, 'Những suy tưởng của Marcus Aurelius về đạo đức, kỷ luật và cách sống theo chủ nghĩa khắc kỷ', 'ACTIVE', 'Kho C-Kệ 2-Ngăn 3', 'Marcus Aurelius', 'Triết học', 'Modern Library', 'https://books.google.com/books/content?vid=ISBN9780812968255&printsec=frontcover&img=1&zoom=1'),
('Tư Duy Cởi Mở', 'Tư Duy Cởi Mở', '9780345472328', 2006, 109000, 55, 'Carol S. Dweck trình bày sức mạnh của tư duy phát triển trong học tập và cuộc sống', 'ACTIVE', 'Kho E-Kệ 6-Ngăn 1', 'Carol S. Dweck', 'Tâm lý - Kỹ năng sống', 'Ballantine Books', 'https://books.google.com/books/content?vid=ISBN9780345472328&printsec=frontcover&img=1&zoom=1'),
('Tư Duy Nhanh Và Chậm', 'Tư Duy Nhanh Và Chậm', '9780374533557', 2011, 159000, 47, 'Daniel Kahneman giải thích hai hệ thống tư duy chi phối quyết định của con người', 'ACTIVE', 'Kho E-Kệ 6-Ngăn 2', 'Daniel Kahneman', 'Tâm lý - Kỹ năng sống', 'Farrar, Straus and Giroux', 'https://books.google.com/books/content?vid=ISBN9780374533557&printsec=frontcover&img=1&zoom=1'),
('Từ Tốt Đến Vĩ Đại', 'Từ Tốt Đến Vĩ Đại', '9780066620992', 2001, 139000, 46, 'Jim Collins phân tích cách các công ty chuyển mình từ tốt đến vĩ đại', 'ACTIVE', 'Kho E-Kệ 6-Ngăn 3', 'Jim Collins', 'Kinh tế - Quản lý', 'HarperBusiness', 'https://books.google.com/books/content?vid=ISBN9780066620992&printsec=frontcover&img=1&zoom=1'),
('Zero To One', 'Zero To One', '9780804139021', 2014, 125000, 52, 'Peter Thiel chia sẻ tư duy xây dựng công ty tạo ra điều mới từ con số không', 'ACTIVE', 'Kho E-Kệ 7-Ngăn 1', 'Peter Thiel', 'Kinh tế - Quản lý', 'Crown Business', 'https://books.google.com/books/content?vid=ISBN9780804139021&printsec=frontcover&img=1&zoom=1'),
('Đi Tìm Lẽ Sống', 'Đi Tìm Lẽ Sống', '9780807014271', 1946, 99000, 58, 'Viktor E. Frankl kể về trải nghiệm trong trại tập trung và ý nghĩa sống', 'ACTIVE', 'Kho C-Kệ 3-Ngăn 1', 'Viktor E. Frankl', 'Triết học', 'Beacon Press', 'https://books.google.com/books/content?vid=ISBN9780807014271&printsec=frontcover&img=1&zoom=1'),
('Điểm Bùng Phát', 'Điểm Bùng Phát', '9780316346627', 2000, 119000, 49, 'Malcolm Gladwell lý giải cách ý tưởng, xu hướng và hành vi lan truyền thành hiện tượng xã hội', 'ACTIVE', 'Kho E-Kệ 7-Ngăn 2', 'Malcolm Gladwell', 'Kinh tế - Quản lý', 'Back Bay Books', 'https://books.google.com/books/content?vid=ISBN9780316346627&printsec=frontcover&img=1&zoom=1');

INSERT INTO categories (name, description, created_by, updated_by)
SELECT DISTINCT n.category_name, 'Danh mục được bổ sung từ dữ liệu catalog/graph', u.id, u.id
FROM normalized_book_catalog n
CROSS JOIN LATERAL (SELECT id FROM users WHERE email = 'admin@bookstore.com' LIMIT 1) u
WHERE NOT EXISTS (
    SELECT 1 FROM categories c
    WHERE c.deleted_at IS NULL AND LOWER(c.name) = LOWER(n.category_name)
);

INSERT INTO authors (name, biography, created_by, updated_by)
SELECT DISTINCT n.author_name, 'Tác giả được bổ sung từ dữ liệu catalog/graph', u.id, u.id
FROM normalized_book_catalog n
CROSS JOIN LATERAL (SELECT id FROM users WHERE email = 'admin@bookstore.com' LIMIT 1) u
WHERE NOT EXISTS (
    SELECT 1 FROM authors a
    WHERE a.deleted_at IS NULL AND LOWER(a.name) = LOWER(n.author_name)
);

INSERT INTO publishers (name, address, phone, email, created_by, updated_by)
SELECT DISTINCT n.publisher_name, 'Chưa cập nhật', '', '', u.id, u.id
FROM normalized_book_catalog n
CROSS JOIN LATERAL (SELECT id FROM users WHERE email = 'admin@bookstore.com' LIMIT 1) u
WHERE NOT EXISTS (
    SELECT 1 FROM publishers p
    WHERE p.deleted_at IS NULL AND LOWER(p.name) = LOWER(n.publisher_name)
);

WITH resolved AS (
    SELECT
        n.*,
        c.id AS category_id,
        a.id AS author_id,
        p.id AS publisher_id
    FROM normalized_book_catalog n
    JOIN categories c ON c.deleted_at IS NULL AND LOWER(c.name) = LOWER(n.category_name)
    JOIN authors a ON a.deleted_at IS NULL AND LOWER(a.name) = LOWER(n.author_name)
    JOIN publishers p ON p.deleted_at IS NULL AND LOWER(p.name) = LOWER(n.publisher_name)
)
UPDATE books b
SET
    category_id = r.category_id,
    author_id = r.author_id,
    publisher_id = r.publisher_id,
    title = r.title,
    isbn = r.isbn,
    publication_year = r.publication_year,
    price = r.price,
    stock_quantity = r.stock_quantity,
    description = r.description,
    business_status = r.business_status,
    storage_location = r.storage_location,
    cover_url = r.cover_url,
    updated_at = CURRENT_TIMESTAMP,
    updated_by = (SELECT id FROM users WHERE email = 'admin@bookstore.com' LIMIT 1)
FROM resolved r
WHERE b.deleted_at IS NULL
  AND LOWER(b.title) = LOWER(r.match_title);

WITH resolved AS (
    SELECT
        n.*,
        c.id AS category_id,
        a.id AS author_id,
        p.id AS publisher_id,
        u.id AS admin_user_id
    FROM normalized_book_catalog n
    JOIN categories c ON c.deleted_at IS NULL AND LOWER(c.name) = LOWER(n.category_name)
    JOIN authors a ON a.deleted_at IS NULL AND LOWER(a.name) = LOWER(n.author_name)
    JOIN publishers p ON p.deleted_at IS NULL AND LOWER(p.name) = LOWER(n.publisher_name)
    CROSS JOIN LATERAL (SELECT id FROM users WHERE email = 'admin@bookstore.com' LIMIT 1) u
)
INSERT INTO books (
    category_id, author_id, publisher_id, title, isbn, publication_year, price,
    stock_quantity, description, business_status, storage_location, cover_url,
    created_by, updated_by
)
SELECT
    r.category_id, r.author_id, r.publisher_id, r.title, r.isbn, r.publication_year,
    r.price, r.stock_quantity, r.description, r.business_status, r.storage_location,
    r.cover_url, r.admin_user_id, r.admin_user_id
FROM resolved r
WHERE NOT EXISTS (
    SELECT 1 FROM books b
    WHERE b.deleted_at IS NULL
      AND (LOWER(b.title) = LOWER(r.title) OR b.isbn = r.isbn)
);
