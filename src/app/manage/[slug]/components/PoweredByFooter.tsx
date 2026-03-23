export default function PoweredByFooter() {
  return (
    <footer className="text-center py-8 mt-auto">
      <p className="text-xs text-gray-400">
        powered by{' '}
        <a
          href="https://jedroplus.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-600 transition-colors duration-200"
        >
          Jedro+
        </a>
      </p>
    </footer>
  );
}
