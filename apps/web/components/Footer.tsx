export function Footer() {
  return (
    <footer className="bg-emerald-600 text-white py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2">Ummati</h3>
          <p className="text-emerald-100 mb-6">
            Where Barakah Meets Opportunity
          </p>
          <div className="flex items-center justify-center gap-2 text-emerald-200">
            <span>Built with</span>
            <span className="text-gold">❤️</span>
            <span>for the Ummah</span>
          </div>
          <p className="text-sm text-emerald-200 mt-6">
            © {new Date().getFullYear()} Ummati. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

