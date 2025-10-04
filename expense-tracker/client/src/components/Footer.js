import React from "react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="container">
        <div className="py-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-lg">
              <div>
                <h3 className="font-semibold text-primary mb-sm">
                  Expese Management System
                </h3>
                <p className="text-sm text-muted">
                  Streamline your expense management with our modern solution.
                </p>
              </div>
            </div>

            {/* <div className="flex gap-lg">
              <div>
                <h4 className="font-medium text-sm mb-sm">Product</h4>
                <ul className="text-sm text-muted space-y-1">
                  <li>
                    <a href="#" className="hover:text-primary">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-primary">
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-primary">
                      Support
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-sm">Company</h4>
                <ul className="text-sm text-muted space-y-1">
                  <li>
                    <a href="#" className="hover:text-primary">
                      About
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-primary">
                      Contact
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-primary">
                      Privacy
                    </a>
                  </li>
                </ul>
              </div>
            </div> */}
          </div>

          <div className="border-t border-light mt-lg pt-md">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">
                © {currentYear} Expese Management System. All rights reserved.
              </p>
              <div className="flex items-center gap-md text-sm text-muted">
                <span>Made with care for better expense management</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
