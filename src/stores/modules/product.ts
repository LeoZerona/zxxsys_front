
import { defineStore } from 'pinia'

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  tags: string[]
  images: string[]
  stock: number
  status: 'active' | 'inactive' | 'discontinued'
  createdAt: string
  updatedAt: string
}

interface ProductState {
  // 产品列表
  products: Product[]
  // 当前选中的产品
  currentProduct: Product | null
  // 产品分类
  categories: string[]
  // 当前筛选条件
  filters: {
    category: string
    status: string
    search: string
    minPrice: number | null
    maxPrice: number | null
  }
  // 排序方式
  sortBy: 'name' | 'price' | 'createdAt'
  sortOrder: 'asc' | 'desc'
  // 分页
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  // 加载状态
  loading: boolean
}

export const useProductStore = defineStore('product', {
  state: (): ProductState => ({
    products: [],
    currentProduct: null,
    categories: ['电子产品', '服装', '食品', '图书', '家居'],
    filters: {
      category: '',
      status: '',
      search: '',
      minPrice: null,
      maxPrice: null
    },
    sortBy: 'name',
    sortOrder: 'asc',
    pagination: {
      page: 1,
      pageSize: 10,
      total: 0
    },
    loading: false
  }),

  getters: {
    // 获取筛选后的产品
    filteredProducts: (state) => {
      let result = [...state.products]

      // 按分类筛选
      if (state.filters.category) {
        result = result.filter(product => product.category === state.filters.category)
      }

      // 按状态筛选
      if (state.filters.status) {
        result = result.filter(product => product.status === state.filters.status)
      }

      // 按搜索词筛选
      if (state.filters.search) {
        const searchLower = state.filters.search.toLowerCase()
        result = result.filter(product => 
          product.name.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower) ||
          product.tags.some(tag => tag.toLowerCase().includes(searchLower))
        )
      }

      // 按价格范围筛选
      if (state.filters.minPrice !== null) {
        result = result.filter(product => product.price >= state.filters.minPrice!)
      }

      if (state.filters.maxPrice !== null) {
        result = result.filter(product => product.price <= state.filters.maxPrice!)
      }

      // 排序
      result.sort((a, b) => {
        let aValue = a[state.sortBy]
        let bValue = b[state.sortBy]

        if (state.sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1
        } else {
          return aValue < bValue ? 1 : -1
        }
      })

      // 更新总数
      state.pagination.total = result.length

      // 分页
      const start = (state.pagination.page - 1) * state.pagination.pageSize
      const end = start + state.pagination.pageSize
      return result.slice(start, end)
    },

    // 获取热门产品
    popularProducts: (state) => {
      return [...state.products]
        .filter(product => product.status === 'active')
        .sort((a, b) => b.stock - a.stock)
        .slice(0, 5)
    },

    // 获取库存不足的产品
    lowStockProducts: (state) => {
      return state.products.filter(product => product.stock < 10 && product.status === 'active')
    }
  },

  actions: {
    // 设置产品列表
    setProducts(products: Product[]) {
      this.products = products
    },

    // 添加产品
    addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
      const newProduct: Product = {
        ...product,
        id: 'product_' + Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      this.products.push(newProduct)
      return newProduct
    },

    // 更新产品
    updateProduct(id: string, updates: Partial<Product>) {
      const index = this.products.findIndex(product => product.id === id)
      if (index !== -1) {
        this.products[index] = {
          ...this.products[index],
          ...updates,
          updatedAt: new Date().toISOString()
        }

        // 如果更新的是当前选中的产品，也要更新
        if (this.currentProduct && this.currentProduct.id === id) {
          this.currentProduct = { ...this.currentProduct, ...updates }
        }
      }
    },

    // 删除产品
    deleteProduct(id: string) {
      const index = this.products.findIndex(product => product.id === id)
      if (index !== -1) {
        this.products.splice(index, 1)

        // 如果删除的是当前选中的产品，清空当前产品
        if (this.currentProduct && this.currentProduct.id === id) {
          this.currentProduct = null
        }
      }
    },

    // 设置当前产品
    setCurrentProduct(product: Product | null) {
      this.currentProduct = product
    },

    // 设置筛选条件
    setFilters(filters: Partial<ProductState['filters']>) {
      this.filters = { ...this.filters, ...filters }
      // 重置页码到第一页
      this.pagination.page = 1
    },

    // 重置筛选条件
    resetFilters() {
      this.filters = {
        category: '',
        status: '',
        search: '',
        minPrice: null,
        maxPrice: null
      }
      this.pagination.page = 1
    },

    // 设置排序
    setSorting(sortBy: ProductState['sortBy'], sortOrder: ProductState['sortOrder'] = 'asc') {
      this.sortBy = sortBy
      this.sortOrder = sortOrder
    },

    // 设置分页
    setPagination(page: number, pageSize?: number) {
      this.pagination.page = page
      if (pageSize !== undefined) {
        this.pagination.pageSize = pageSize
      }
    },

    // 设置加载状态
    setLoading(loading: boolean) {
      this.loading = loading
    },

    // 模拟获取产品列表
    async fetchProducts() {
      this.setLoading(true)

      try {
        // 模拟API请求
        await new Promise(resolve => setTimeout(resolve, 1000))

        // 模拟返回的产品数据
        const mockProducts: Product[] = [
          {
            id: 'product_1',
            name: '智能手机',
            description: '高性能智能手机，配备高清摄像头',
            price: 4999,
            category: '电子产品',
            tags: ['手机', '智能', '5G'],
            images: ['https://example.com/phone1.jpg'],
            stock: 50,
            status: 'active',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z'
          },
          {
            id: 'product_2',
            name: '运动鞋',
            description: '舒适透气的运动鞋，适合各种运动',
            price: 399,
            category: '服装',
            tags: ['鞋子', '运动', '舒适'],
            images: ['https://example.com/shoes1.jpg'],
            stock: 8,
            status: 'active',
            createdAt: '2023-01-02T00:00:00Z',
            updatedAt: '2023-01-02T00:00:00Z'
          },
          {
            id: 'product_3',
            name: '咖啡豆',
            description: '精选阿拉比卡咖啡豆，口感醇厚',
            price: 89,
            category: '食品',
            tags: ['咖啡', '豆子', '进口'],
            images: ['https://example.com/coffee1.jpg'],
            stock: 100,
            status: 'active',
            createdAt: '2023-01-03T00:00:00Z',
            updatedAt: '2023-01-03T00:00:00Z'
          }
        ]

        this.setProducts(mockProducts)
        return { success: true, data: mockProducts }
      } catch (error) {
        return { success: false, error }
      } finally {
        this.setLoading(false)
      }
    },

    // 模拟获取单个产品
    async fetchProduct(id: string) {
      this.setLoading(true)

      try {
        // 模拟API请求
        await new Promise(resolve => setTimeout(resolve, 500))

        // 查找产品
        const product = this.products.find(p => p.id === id)

        if (product) {
          this.setCurrentProduct(product)
          return { success: true, data: product }
        } else {
          return { success: false, error: '产品不存在' }
        }
      } catch (error) {
        return { success: false, error }
      } finally {
        this.setLoading(false)
      }
    }
  }
})
