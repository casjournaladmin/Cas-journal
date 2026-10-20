import Link from "next/link";

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="cas-footer">
      <div className="cas-footer-inner">
        <div className="cas-footer-grid">
          <div className="cas-footer-col">
            <h4>CASJOURNALS</h4>
            <p>
              <strong>CASJOURNALS:</strong> Platform for Peer-reviewed,
              Open-access journals for Institution and academic society
              journals.
            </p>
            <p
              style={{
                fontSize: "13px",
                color: "rgba(240,249,255,0.65)",
              }}
            >
              Advancing Knowledge. Inspiring Growth. Continuous rolling
              publication across multidisciplinary scholarship.
            </p>
          </div>

          <div className="cas-footer-col">
            <h4>For Authors</h4>
            <ul className="cas-footer-links">
              <li>
                <Link href="/author-guidelines">Author Guidelines</Link>
              </li>
              <li>
                <Link href="/how-to-write">How to Write a Journal Paper</Link>
              </li>
              <li>
                <Link href="/submit">Submit Your Paper</Link>
              </li>
              <li>
                <Link href="/announcements">Call for Papers</Link>
              </li>
              <li>
                <Link href="/processing-charges">
                  Article Processing Charges
                </Link>
              </li>
              <li>
                <Link href="/withdrawal-correction">
                  Article Withdrawal &amp; Correction
                </Link>
              </li>
              <li>
                <Link href="/copyright-form">Copyright Form</Link>
              </li>
              <li>
                <Link href="/apply-reviewer">Become a Reviewer</Link>
              </li>
              <li>
                <Link href="/editorial-board">Join our Editorial Team</Link>
              </li>
            </ul>
          </div>

          <div className="cas-footer-col">
            <h4>Policies</h4>
            <ul className="cas-footer-links">
              <li>
                <Link href="/ethics-malpractice">
                  Publication Ethics &amp; Malpractice
                </Link>
              </li>
              <li>
                <Link href="/peer-review-policy">Peer Review Policy</Link>
              </li>
              <li>
                <Link href="/open-access-policy">Open Access Policy</Link>
              </li>
              <li>
                <Link href="/privacy-policy">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms-conditions">Terms &amp; Conditions</Link>
              </li>
              <li>
                <Link href="/refund-policy">Refund Policy</Link>
              </li>
              <li>
                <Link href="/manuscript-transfer-policy">
                  Manuscript Transfer Policy
                </Link>
              </li>
              <li>
                <Link href="/ai-policy">
                  Artificial Intelligence (AI) Policy
                </Link>
              </li>
            </ul>
          </div>

          <div className="cas-footer-col">
            <h4>Navigation</h4>
            <ul className="cas-footer-links">
              <li>
                <Link href="/">Home</Link>
              </li>
              <li>
                <Link href="/current-issue">Current Issue</Link>
              </li>
              <li>
                <Link href="/archives">Archive</Link>
              </li>
              <li>
                <Link href="/indexing-abstracting">
                  Indexing &amp; Abstracting
                </Link>
              </li>
              <li>
                <Link href="/login">Sign In / Track</Link>
              </li>
              <li>
                <Link href="/contact">Contact Us</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="cas-footer-strip">
          <div className="cas-footer-strip-title">
            Indexing &amp; Discoverability
          </div>
          <div className="cas-footer-strip-items">
            <span>Google Scholar</span>
            <span>Crossref DOIs</span>
            <span>ISSN International</span>
            <span>OpenAlex</span>
            <span>Scilit</span>
            <span>Semantic Scholar</span>
            <span>Lens</span>
            <span>Dimensions</span>
          </div>
        </div>

        <div className="cas-footer-bottom">
          <div>
            &copy; {currentYear}&ndash; CASJOURNALS. All rights reserved.
          </div>
          <div>Peer-Reviewed Open-Access Scholarly Publishing</div>
        </div>
      </div>
    </footer>
  );
}
