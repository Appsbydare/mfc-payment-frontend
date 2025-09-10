import React from 'react';
import Layout from '../components/layout/Layout';
import DiscountManager from '../components/DiscountManager';

const DiscountManagerPage: React.FC = () => {
  return (
    <Layout>
      <div className="p-6">
        <DiscountManager />
      </div>
    </Layout>
  );
};

export default DiscountManagerPage;
