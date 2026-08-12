import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
}

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    fetchProducts();
  }, [offset]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getProducts(20, offset);
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      fetchProducts();
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.searchProducts(searchTerm);
      setProducts(response.data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🌾 Products Marketplace</h1>

      <form onSubmit={handleSearch} style={styles.searchForm}>
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
        <button type="submit" style={styles.searchButton}>
          Search
        </button>
      </form>

      {loading ? (
        <div style={styles.loading}>Loading...</div>
      ) : (
        <>
          <div style={styles.productGrid}>
            {products.map((product) => (
              <div key={product.id} style={styles.productCard}>
                <h3 style={styles.productName}>{product.name}</h3>
                <p style={styles.productDescription}>{product.description}</p>
                <div style={styles.productDetails}>
                  <span style={styles.price}>KES {product.price}</span>
                  <span style={styles.category}>{product.category}</span>
                </div>
                <p style={styles.quantity}>
                  Available: {product.quantity} units
                </p>
                <button style={styles.buyButton}>Add to Cart</button>
              </div>
            ))}
          </div>

          <div style={styles.pagination}>
            <button
              onClick={() => setOffset(Math.max(0, offset - 20))}
              disabled={offset === 0}
              style={styles.paginationButton}
            >
              Previous
            </button>
            <span>Page {offset / 20 + 1}</span>
            <button
              onClick={() => setOffset(offset + 20)}
              style={styles.paginationButton}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  } as React.CSSProperties,
  title: {
    fontSize: '28px',
    marginBottom: '24px',
    color: '#333',
  } as React.CSSProperties,
  searchForm: {
    display: 'flex',
    gap: '10px',
    marginBottom: '24px',
  } as React.CSSProperties,
  searchInput: {
    flex: 1,
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  } as React.CSSProperties,
  searchButton: {
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
  } as React.CSSProperties,
  loading: {
    textAlign: 'center' as const,
    padding: '40px',
    fontSize: '18px',
    color: '#666',
  },
  productGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  } as React.CSSProperties,
  productCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  productName: {
    fontSize: '18px',
    marginBottom: '8px',
    color: '#333',
  } as React.CSSProperties,
  productDescription: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '12px',
    flex: 1,
  } as React.CSSProperties,
  productDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
  } as React.CSSProperties,
  price: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#4CAF50',
  } as React.CSSProperties,
  category: {
    fontSize: '12px',
    backgroundColor: '#f0f0f0',
    padding: '4px 8px',
    borderRadius: '4px',
    color: '#666',
  } as React.CSSProperties,
  quantity: {
    fontSize: '12px',
    color: '#999',
    marginBottom: '12px',
  } as React.CSSProperties,
  buyButton: {
    padding: '10px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
  } as React.CSSProperties,
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    alignItems: 'center',
  } as React.CSSProperties,
  paginationButton: {
    padding: '8px 16px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  } as React.CSSProperties,
};

export default ProductsPage;
