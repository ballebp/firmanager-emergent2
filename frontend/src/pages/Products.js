import React, { useState, useEffect } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/api';
import { Plus, Edit, Trash2, CheckSquare, Square, X, Image, Upload } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    produktnr: '',
    navn: '',
    beskrivelse: '',
    kategori: '',
    kundepris: 0,
    pa_lager: 0,
    image_url: ''
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await getProducts();
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        kundepris: parseFloat(formData.kundepris),
        pa_lager: parseInt(formData.pa_lager)
      };
      if (editingProduct) {
        await updateProduct(editingProduct.id, submitData);
      } else {
        await createProduct(submitData);
      }
      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      loadProducts();
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Kunne ikke lagre produkt');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      produktnr: product.produktnr,
      navn: product.navn,
      beskrivelse: product.beskrivelse || '',
      kategori: product.kategori || '',
      kundepris: product.kundepris,
      pa_lager: product.pa_lager,
      image_url: product.image_url || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
        loadProducts();
      } catch (error) {
        console.error('Failed to delete product:', error);
        alert('Could not save product');
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedProducts.size === 0) return;
    
    if (window.confirm(`Er du sikker på at du vil slette ${selectedProducts.size} valgte produkter?`)) {
      try {
        const deletePromises = Array.from(selectedProducts).map(id => deleteProduct(id));
        await Promise.all(deletePromises);
        setSelectedProducts(new Set());
        loadProducts();
      } catch (error) {
        console.error('Failed to delete products:', error);
        alert('Kunne ikke slette alle produkter');
      }
    }
  };

  const toggleSelectProduct = (id) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProducts(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)));
    }
  };

  const resetForm = () => {
    setFormData({
      produktnr: '',
      navn: '',
      beskrivelse: '',
      kategori: '',
      kundepris: 0,
      pa_lager: 0,
      image_url: ''
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !editingProduct) return;
    
    setUploadingImage(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    
    try {
      const API_URL = process.env.REACT_APP_BACKEND_URL;
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/products/${editingProduct.id}/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataUpload
      });
      
      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, image_url: data.image_url }));
        loadProducts();
      } else {
        alert('Kunne ikke laste opp bilde');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Feil ved opplasting av bilde');
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div data-testid="products-page">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Product Catalog</h1>
          <p className="text-sm text-gray-400 mt-1">{products.length} products</p>
        </div>
        <div className="flex gap-3">
          {selectedProducts.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              data-testid="delete-selected-products-button"
              className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 rounded transition-colors"
            >
              <Trash2 size={20} />
              Slett valgte ({selectedProducts.size})
            </button>
          )}
          <button
            onClick={() => {
              resetForm();
              setEditingProduct(null);
              setShowModal(true);
            }}
            data-testid="add-product-button"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            <Plus size={20} />
            Nytt produkt
          </button>
        </div>
      </div>

      {/* Select all checkbox */}
      {products.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
          >
            {selectedProducts.size === products.length ? (
              <CheckSquare size={18} className="text-blue-500" />
            ) : (
              <Square size={18} />
            )}
            Velg alle
          </button>
          {selectedProducts.size > 0 && (
            <span className="text-sm text-gray-500">({selectedProducts.size} valgt)</span>
          )}
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="p-4 text-left w-10"></th>
              <th className="p-4 text-left w-16">Image</th>
              <th className="p-4 text-left">Product No</th>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Category</th>
              <th className="p-4 text-right">Price</th>
              <th className="p-4 text-right">Stock</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-gray-400">
                  Laster...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-gray-400">
                  No products found
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className={`border-b border-gray-800 hover:bg-gray-800/50 ${selectedProducts.has(product.id) ? 'bg-blue-900/20' : ''}`}>
                  <td className="p-4">
                    <button onClick={() => toggleSelectProduct(product.id)}>
                      {selectedProducts.has(product.id) ? (
                        <CheckSquare size={18} className="text-blue-500" />
                      ) : (
                        <Square size={18} className="text-gray-500" />
                      )}
                    </button>
                  </td>
                  <td className="p-4">
                    {product.image_url ? (
                      <img 
                        src={product.image_url.startsWith('http') ? product.image_url : `${process.env.REACT_APP_BACKEND_URL}${product.image_url}`} 
                        alt={product.navn}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center">
                        <Image size={20} className="text-gray-500" />
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-mono text-blue-400">{product.produktnr}</td>
                  <td className="p-4">{product.navn}</td>
                  <td className="p-4 text-gray-400">{product.kategori || '-'}</td>
                  <td className="p-4 text-right">{product.kundepris.toLocaleString('no-NO')} kr</td>
                  <td className="p-4 text-right">
                    <span className={`px-2 py-1 rounded text-sm ${product.pa_lager > 10 ? 'bg-green-900/50 text-green-400' : product.pa_lager > 0 ? 'bg-yellow-900/50 text-yellow-400' : 'bg-red-900/50 text-red-400'}`}>
                      {product.pa_lager}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 hover:bg-gray-700 rounded transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 hover:bg-red-900/30 text-red-400 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {editingProduct ? 'Edit Product' : 'New Product'}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditingProduct(null); }}
                className="p-2 hover:bg-gray-800 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Product Number</label>
                <input
                  type="text"
                  value={formData.produktnr}
                  onChange={(e) => setFormData({ ...formData, produktnr: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.navn}
                  onChange={(e) => setFormData({ ...formData, navn: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={formData.beskrivelse}
                  onChange={(e) => setFormData({ ...formData, beskrivelse: e.target.value })}
                  rows="2"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                <input
                  type="text"
                  value={formData.kategori}
                  onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              
              {/* Image section */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Product Image</label>
                <div className="space-y-2">
                  {/* Image URL input */}
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="Image URL (e.g. https://...)"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                  />
                  
                  {/* File upload (only for existing products) */}
                  {editingProduct && (
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded cursor-pointer transition-colors">
                        <Upload size={16} />
                        <span className="text-sm">{uploadingImage ? 'Uploading...' : 'Upload file'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                      </label>
                      <span className="text-xs text-gray-400">JPG, PNG, GIF, WebP</span>
                    </div>
                  )}
                  
                  {/* Image preview */}
                  {formData.image_url && (
                    <div className="mt-2">
                      <img 
                        src={formData.image_url.startsWith('/api') ? `${process.env.REACT_APP_BACKEND_URL}${formData.image_url}` : formData.image_url}
                        alt="Preview"
                        className="w-24 h-24 object-cover rounded border border-gray-700"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Customer Price (kr)</label>
                  <input
                    type="number"
                    value={formData.kundepris}
                    onChange={(e) => setFormData({ ...formData, kundepris: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">In Stock</label>
                  <input
                    type="number"
                    value={formData.pa_lager}
                    onChange={(e) => setFormData({ ...formData, pa_lager: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingProduct(null); }}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                >
                  {editingProduct ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
