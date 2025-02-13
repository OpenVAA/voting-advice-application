import { Page } from '@strapi/strapi/admin';
import { Route, Routes } from 'react-router-dom';
import { HomePage } from './HomePage';

export function App() {
  return (
    <Routes>
      <Route index element={<HomePage />} />
      <Route path="*" element={<Page.Error />} />
    </Routes>
  );
}
