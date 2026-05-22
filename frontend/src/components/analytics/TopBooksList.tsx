import type { TopBook } from '../../types/interactionEvent';

interface TopBooksListProps {
  title: string;
  books: TopBook[];
  onBookClick: (bookId: number) => void;
  icon: string;
  emptyMessage?: string;
}

export const TopBooksList = ({
  title,
  books,
  onBookClick,
  icon,
  emptyMessage = 'Không có dữ liệu sách'
}: TopBooksListProps) => {
  if (books.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">{icon}</span>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        <div className="flex items-center justify-center h-[200px] bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="space-y-2">
        {books.slice(0, 5).map((book, index) => (
          <div
            key={book.bookId}
            onClick={() => onBookClick(book.bookId)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-gray-100"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-sm font-semibold text-blue-600">
                {index + 1}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {book.bookTitle}
              </p>
            </div>
            <div className="flex-shrink-0">
              <span className="text-sm font-semibold text-gray-600">
                {book.count.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
