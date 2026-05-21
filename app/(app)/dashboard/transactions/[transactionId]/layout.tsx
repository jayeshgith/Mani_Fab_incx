import TransactionBackButton from "../transaction-back-button";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <TransactionBackButton fallbackHref="/dashboard/transactions" />
      {children}
    </div>
  );
};

export default Layout;
