import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  ShoppingCartOutlined,
  LineChartOutlined,
  AlertOutlined,
  SettingOutlined,
  LogoutOutlined,
  StockOutlined,
  PieChartOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { 
  Card, 
  Row, 
  Col, 
  Table, 
  Tag, 
  Button, 
  Space, 
  Form, 
  InputNumber, 
  Select, 
  Checkbox, 
  Descriptions, 
  Empty ,
  Layout, Menu,
  theme, Badge, Statistic,message
} from 'antd';
import Chart from 'react-apexcharts';
// import { Layout, Menu, Button, theme, Card, Table, Tag, Space, Badge, Statistic, Row, Col, message } from 'antd';
// import Chart from 'react-apexcharts';

const { Header, Sider, Content } = Layout;

const AdminDashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [products, setProducts] = useState([]); // Changed from inventory to products
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState('dashboard');
  const [ws, setWs] = useState(null);
  const navigate = useNavigate();
  
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') {
      navigate('/login');
    }

    // Initialize WebSocket connection
    const socket = new WebSocket('ws://localhost:5000');
    socket.onopen = () => console.log('WebSocket connected');
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'inventory_update') {
        setProducts(prev => prev.map(item => 
          item._id === data.productId ? {...item, stock: data.newStock} : item
        ));
      }
    };
    setWs(socket);

    fetchProducts(); // Changed from fetchInventory
    fetchAnalytics();
    fetchAlerts();

    return () => {
      if (ws) ws.close();
    };
  }, [navigate]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/products'); // Updated endpoint
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      message.error('Failed to fetch products');
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/analytics');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      message.error('Failed to fetch analytics');
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/alerts');
      setAlerts(response.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      message.error('Failed to fetch alerts');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const handleStockAdjustment = async (productId, adjustment) => {
    try {
      await axios.post(`http://localhost:5000/api/inventory-movements`, {
        productId,
        type: 'adjustment',
        quantity: Math.abs(adjustment),
        previousStock: products.find(p => p._id === productId).stock,
        newStock: products.find(p => p._id === productId).stock + adjustment,
        notes: 'Manual adjustment'
      });
      fetchProducts();
      message.success('Stock adjusted successfully');
    } catch (error) {
      console.error('Error adjusting stock:', error);
      message.error('Failed to adjust stock');
    }
  };

  const generateForecast = async (productId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/forecast/${productId}`);
      message.success('Forecast generated successfully');
      return response.data;
    } catch (error) {
      console.error('Error generating forecast:', error);
      message.error('Failed to generate forecast');
      return null;
    }
  };

  const markAlertResolved = async (alertId) => {
    try {
      await axios.patch(`http://localhost:5000/api/alerts/${alertId}/resolve`);
      fetchAlerts();
      message.success('Alert resolved successfully');
    } catch (error) {
      console.error('Error resolving alert:', error);
      message.error('Failed to resolve alert');
    }
  };

  const productColumns = [ // Changed from inventoryColumns
    {
      title: 'Product',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src={record.imageUrl} 
            alt={text} 
            style={{ width: 40, height: 40, marginRight: 10, borderRadius: 4 }} 
          />
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `$${price.toFixed(2)}`,
    },
    {
      title: 'Cost',
      dataIndex: 'cost',
      key: 'cost',
      render: (cost) => `$${cost.toFixed(2)}`,
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock, record) => (
        <div>
          <Tag color={stock <= record.minStock ? 'red' : stock >= record.maxStock ? 'orange' : 'green'}>
            {stock}
          </Tag>
          {stock <= record.minStock && <Tag color="red">Reorder</Tag>}
        </div>
      ),
    },
    {
      title: 'Forecast',
      key: 'forecast',
      render: (_, record) => (
        <Button 
          size="small" 
          onClick={async () => {
            const forecast = await generateForecast(record._id);
            if (forecast) {
              // Update UI with forecast data
              fetchProducts();
            }
          }}
        >
          Generate
        </Button>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="primary" 
            size="small" 
            onClick={() => handleStockAdjustment(record._id, 1)}
          >
            +1
          </Button>
          <Button 
            type="primary" 
            size="small" 
            onClick={() => handleStockAdjustment(record._id, -1)}
          >
            -1
          </Button>
          <Button size="small">Edit</Button>
        </Space>
      ),
    },
  ];

  
  const salesChartOptions = {
    chart: {
      type: 'line',
      height: 350,
    },
    stroke: {
      curve: 'smooth'
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    },
    title: {
      text: 'Monthly Sales Trend',
      align: 'left'
    }
  };

  const inventoryChartOptions = {
    chart: {
      type: 'bar',
      height: 350,
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: true,
      }
    },
    dataLabels: {
      enabled: false
    },
    xaxis: {
      categories: products.slice(0, 10).map(item => item.name)
    },
    title: {
      text: 'Top 10 Products by Stock',
      align: 'left'
    }
  };
    const alertColumns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const typeMap = {
          'low_stock': { color: 'red', text: 'Low Stock' },
          'overstock': { color: 'orange', text: 'Overstock' },
          'reorder': { color: 'blue', text: 'Reorder' }
        };
        return <Tag color={typeMap[type].color}>{typeMap[type].text}</Tag>;
      },
    },
    {
      title: 'Product',
      dataIndex: 'productId',
      key: 'product',
      render: (id) => {
        const product = products.find(p => p._id === id);
        return product ? product.name : 'Unknown Product';
      },
    },
    {
      title: 'Current Value',
      dataIndex: 'currentValue',
      key: 'currentValue',
    },
    {
      title: 'Threshold',
      dataIndex: 'thresholdValue',
      key: 'thresholdValue',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button size="small" onClick={() => markAlertResolved(record._id)}>
          Resolve
        </Button>
      ),
    },
  ];

  const renderContent = () => {
    switch (selectedMenu) {
      case 'dashboard':
        return (
          <>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card>
                  <Statistic 
                    title="Total Products" 
                    value={products.length} 
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic 
                    title="Inventory Value" 
                    prefix="$" 
                    value={products.reduce((sum, p) => sum + (p.stock * p.cost), 0).toFixed(2)} 
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic 
                    title="Low Stock Items" 
                    value={products.filter(p => p.stock <= p.minStock).length} 
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic 
                    title="Out of Stock" 
                    value={products.filter(p => p.stock <= 0).length} 
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Card>
              </Col>
            </Row>
            
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <Card>
                  <Chart 
                    options={salesChartOptions} 
                    series={[{ name: 'Sales', data: [30, 40, 45, 50, 49, 60, 70, 91, 125, 150, 170, 200] }]} 
                    type="line" 
                    height={350} 
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card>
                  <Chart 
                    options={{
                      ...inventoryChartOptions,
                      xaxis: {
                        categories: products.slice(0, 10).map(item => item.name)
                      }
                    }} 
                    series={[{ name: 'Stock', data: products.slice(0, 10).map(item => item.stock) }]} 
                    type="bar" 
                    height={350} 
                  />
                </Card>
              </Col>
            </Row>
            
            <Card title="Recent Inventory Alerts" style={{ marginBottom: 24 }}>
              <Table 
                columns={alertColumns} 
                dataSource={alerts} 
                rowKey="_id" 
                size="small" 
                pagination={{ pageSize: 5 }} 
              />
            </Card>
          </>
        );
      case 'inventory':
        return (
          <Card title="Product Management">
            <Table 
              columns={productColumns} 
              dataSource={products} 
              rowKey="_id" 
              expandable={{
                expandedRowRender: record => (
                  <div style={{ margin: 0 }}>
                    <p><strong>Min Stock:</strong> {record.minStock}</p>
                    <p><strong>Max Stock:</strong> {record.maxStock}</p>
                    <p><strong>Reorder Point:</strong> {record.reorderPoint}</p>
                    <p><strong>Lead Time:</strong> {record.leadTime} days</p>
                    <p><strong>Supplier:</strong> {record.supplier}</p>
                    {record.lastRestock && <p><strong>Last Restock:</strong> {new Date(record.lastRestock).toLocaleDateString()}</p>}
                    {record.forecastedDemand && <p><strong>Forecasted Demand:</strong> {record.forecastedDemand}/day</p>}
                  </div>
                ),
                rowExpandable: record => true,
              }}
            />
          </Card>
        );

         case 'analytics':
        return (
          <Card title="Advanced Analytics">
            <div style={{ height: '70vh' }}>
              {/* Placeholder for advanced analytics components */}
              <p>Advanced inventory analytics and forecasting tools will be displayed here.</p>
            </div>
          </Card>
        );
        case 'analytics':
  return (
    <Card title="Advanced Analytics">
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card>
            <Chart
              options={{
                chart: { type: 'area', height: 350 },
                stroke: { curve: 'smooth' },
                xaxis: {
                  categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                  title: { text: 'Months' }
                },
                yaxis: { title: { text: 'Quantity' } },
                title: { text: 'Inventory Trends', align: 'left' },
                colors: ['#008FFB', '#00E396', '#FEB019']
              }}
              series={[
                {
                  name: 'Sales',
                  data: [30, 40, 35, 50, 49, 60]
                },
                {
                  name: 'Restocks',
                  data: [20, 32, 25, 40, 39, 45]
                }
              ]}
              type="area"
              height={350}
            />
          </Card>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Card title="Stock Level Distribution">
            <Chart
              options={{
                chart: { type: 'pie', height: 350 },
                labels: ['In Stock', 'Low Stock', 'Out of Stock'],
                colors: ['#00E396', '#FEB019', '#FF4560'],
                title: { text: 'Stock Status', align: 'left' }
              }}
              series={[
                products.filter(p => p.stock > p.minStock).length,
                products.filter(p => p.stock <= p.minStock && p.stock > 0).length,
                products.filter(p => p.stock <= 0).length
              ]}
              type="pie"
              height={350}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Category Breakdown">
            <Chart
              options={{
                chart: { type: 'donut', height: 350 },
                labels: [...new Set(products.map(p => p.category))],
                plotOptions: { pie: { donut: { labels: { show: true } } } },
                title: { text: 'By Category', align: 'left' }
              }}
              series={[...new Set(products.map(p => p.category))].map(category => 
                products.filter(p => p.category === category).length
              )}
              type="donut"
              height={350}
            />
          </Card>
        </Col>
      </Row>
    </Card>
  );
  case 'forecasting':
  return (
    <Card title="Demand Forecasting">
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Table
            columns={[
              {
                title: 'Product',
                dataIndex: 'name',
                key: 'name',
                render: (text, record) => (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img 
                      src={record.imageUrl} 
                      alt={`Product: ${text}`}
                      style={{ width: 40, height: 40, marginRight: 10, borderRadius: 4 }} 
                    />
                    <span>{text}</span>
                  </div>
                )
              },
              {
                title: 'Current Stock',
                dataIndex: 'stock',
                key: 'stock'
              },
              {
                title: 'Forecasted Demand',
                dataIndex: 'forecastedDemand',
                key: 'forecastedDemand',
                render: (value, record) => value ? (
                  <div>
                    <div>{value} units/day</div>
                    {record.confidenceInterval && (
                      <div style={{ fontSize: 12, color: '#666' }}>
                        ({record.confidenceInterval[0]} - {record.confidenceInterval[1]})
                      </div>
                    )}
                  </div>
                ) : 'Not calculated'
              },
              {
                title: 'Status',
                key: 'status',
                render: (_, record) => (
                  <Tag color={
                    !record.forecastedDemand ? 'default' :
                    record.forecastedDemand > record.stock ? 'red' : 
                    record.forecastedDemand > record.stock * 0.7 ? 'orange' : 'green'
                  }>
                    {!record.forecastedDemand ? 'Not Generated' :
                     record.forecastedDemand > record.stock ? 'High Risk' : 
                     record.forecastedDemand > record.stock * 0.7 ? 'Medium Risk' : 'Low Risk'}
                  </Tag>
                )
              },
              {
                title: 'Action',
                key: 'action',
                render: (_, record) => (
                  <Button 
                    type="primary" 
                    onClick={() => generateForecast(record._id)}
                    // loading={record._id === generatingForecastFor}
                  >
                    {record.forecastedDemand ? 'Regenerate' : 'Generate'} Forecast
                  </Button>
                )
              }
            ]}
            dataSource={products.map(p => ({
              ...p,
              confidenceInterval: p.forecastedDemand ? 
                [Math.floor(p.forecastedDemand * 0.8), Math.ceil(p.forecastedDemand * 1.2)] : null
            }))}
            rowKey="_id"
          />
        </Col>
      </Row>
      {products.some(p => p.forecastedDemand) && (
        <Row gutter={16}>
          <Col span={24}>
            <Card title="Demand Forecast Trends">
              <Chart
                options={{
                  chart: { type: 'line', height: 350 },
                  stroke: { curve: 'smooth' },
                  xaxis: {
                    categories: products
                      .filter(p => p.forecastedDemand)
                      .sort((a, b) => b.forecastedDemand - a.forecastedDemand)
                      .slice(0, 5)
                      .map(p => p.name),
                    title: { text: 'Products' }
                  },
                  yaxis: { title: { text: 'Units per day' } },
                  title: { text: 'Top Products Forecast', align: 'left' },
                  tooltip: {
                    y: {
                      formatter: (value) => `${value} units/day`
                    }
                  }
                }}
                series={[{
                  name: 'Forecasted Demand',
                  data: products
                    .filter(p => p.forecastedDemand)
                    .sort((a, b) => b.forecastedDemand - a.forecastedDemand)
                    .slice(0, 5)
                    .map(p => p.forecastedDemand)
                }]}
                type="line"
                height={350}
              />
            </Card>
          </Col>
        </Row>
      )}
    </Card>
  );

// case 'forecasting':
//   return (
//     <Card title="Demand Forecasting">
//       <Row gutter={16} style={{ marginBottom: 24 }}>
//         <Col span={24}>
//           <Table
//             columns={[
//               {
//                 title: 'Product',
//                 dataIndex: 'name',
//                 key: 'name',
//                 render: (text, record) => (
//                   <div style={{ display: 'flex', alignItems: 'center' }}>
//                     <img 
//                       src={record.imageUrl} 
//                       alt={`Product: ${text}`}
//                       style={{ width: 40, height: 40, marginRight: 10, borderRadius: 4 }} 
//                     />
//                     <span>{text}</span>
//                   </div>
//                 )
//               },
//               {
//                 title: 'Current Stock',
//                 dataIndex: 'stock',
//                 key: 'stock'
//               },
//               {
//                 title: 'Forecasted Demand',
//                 dataIndex: 'forecastedDemand',
//                 key: 'forecastedDemand',
//                 render: (value) => value || 'Not calculated'
//               },
//               {
//                 title: 'Confidence',
//                 key: 'confidence',
//                 render: (_, record) => (
//                   <Tag color={
//                     record.forecastedDemand > record.stock ? 'red' : 
//                     record.forecastedDemand > record.stock * 0.7 ? 'orange' : 'green'
//                   }>
//                     {record.forecastedDemand > record.stock ? 'High Risk' : 
//                      record.forecastedDemand > record.stock * 0.7 ? 'Medium Risk' : 'Low Risk'}
//                   </Tag>
//                 )
//               },
//               {
//                 title: 'Action',
//                 key: 'action',
//                 render: (_, record) => (
//                   <Button 
//                     type="primary" 
//                     onClick={() => generateForecast(record._id)}
//                   >
//                     Generate Forecast
//                   </Button>
//                 )
//               }
//             ]}
//             dataSource={products}
//             rowKey="_id"
//           />
//         </Col>
//       </Row>
//       <Row gutter={16}>
//         <Col span={24}>
//           <Card title="Demand Forecast Trends">
//             <Chart
//               options={{
//                 chart: { type: 'line', height: 350 },
//                 stroke: { curve: 'smooth' },
//                 xaxis: {
//                   categories: products.slice(0, 5).map(p => p.name),
//                   title: { text: 'Products' }
//                 },
//                 yaxis: { title: { text: 'Units' } },
//                 title: { text: 'Top Products Forecast', align: 'left' }
//               }}
//               series={[{
//                 name: 'Forecasted Demand',
//                 data: products.slice(0, 5).map(p => p.forecastedDemand || 0)
//               }]}
//               type="line"
//               height={350}
//             />
//           </Card>
//         </Col>
//       </Row>
//     </Card>
//   );

case 'reports':
  return (
    <Card title="Inventory Reports">
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card 
            title="Generate Reports"
            extra={
              <Space>
                <Button type="primary">Export as PDF</Button>
                <Button>Export as CSV</Button>
              </Space>
            }
          >
            <Row gutter={16}>
              <Col span={8}>
                <Card title="Stock Report">
                  <p>Current inventory status and stock levels</p>
                  <Button type="primary" block>Generate</Button>
                </Card>
              </Col>
              <Col span={8}>
                <Card title="Sales Report">
                  <p>Sales history and revenue analysis</p>
                  <Button type="primary" block>Generate</Button>
                </Card>
              </Col>
              <Col span={8}>
                <Card title="Forecast Report">
                  <p>Demand forecasting and predictions</p>
                  <Button type="primary" block>Generate</Button>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={24}>
          <Card title="Recent Reports">
            <Table
              columns={[
                { title: 'Report Name', dataIndex: 'name', key: 'name' },
                { title: 'Generated On', dataIndex: 'date', key: 'date' },
                { title: 'Type', dataIndex: 'type', key: 'type' },
                { 
                  title: 'Actions', 
                  key: 'actions',
                  render: () => (
                    <Space>
                      <Button size="small">Download</Button>
                      <Button size="small">Share</Button>
                    </Space>
                  )
                }
              ]}
              dataSource={[
                { name: 'Monthly Inventory Report', date: '2023-05-01', type: 'Stock' },
                { name: 'Q2 Sales Analysis', date: '2023-04-15', type: 'Sales' },
                { name: 'Annual Forecast', date: '2023-01-10', type: 'Forecast' }
              ]}
              rowKey="name"
            />
          </Card>
        </Col>
      </Row>
    </Card>
  );

case 'settings':
  return (
    <Card title="System Settings">
      <Row gutter={16}>
        <Col span={12}>
          <Card title="Inventory Settings">
            <Form layout="vertical">
              <Form.Item label="Low Stock Threshold (%)">
                <InputNumber style={{ width: '100%' }} defaultValue={20} />
              </Form.Item>
              <Form.Item label="Reorder Point Buffer">
                <InputNumber style={{ width: '100%' }} defaultValue={10} />
              </Form.Item>
              <Form.Item label="Default Lead Time (days)">
                <InputNumber style={{ width: '100%' }} defaultValue={7} />
              </Form.Item>
              <Button type="primary">Save Settings</Button>
            </Form>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="User Preferences">
            <Form layout="vertical">
              <Form.Item label="Theme">
                <Select defaultValue="light">
                  <Select.Option value="lightl̥">Light</Select.Option>
                  <Select.Option value="dark">Dark</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label="Notifications">
                <Checkbox defaultChecked>Email Alerts</Checkbox>
                <Checkbox defaultChecked>System Notifications</Checkbox>
              </Form.Item>
              <Form.Item label="Dashboard Refresh Rate">
                <Select defaultValue="30">
                  <Select.Option value="15">15 seconds</Select.Option>
                  <Select.Option value="30">30 seconds</Select.Option>
                  <Select.Option value="60">1 minute</Select.Option>
                </Select>
              </Form.Item>
              <Button type="primary">Save Preferences</Button>
            </Form>
          </Card>
        </Col>
      </Row>
      <Row style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="System Information">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Version">1.2.3</Descriptions.Item>
              <Descriptions.Item label="Last Updated">2023-05-15</Descriptions.Item>
              <Descriptions.Item label="Database">MongoDB 5.0</Descriptions.Item>
              <Descriptions.Item label="Server">Node.js 16.14</Descriptions.Item>
              <Descriptions.Item label="Storage Used">1.2GB/5GB</Descriptions.Item>
              <Descriptions.Item label="Active Users">3</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </Card>
  );

      case 'alerts':
        return (
          <Card title="Inventory Alerts">
            <Table 
              columns={alertColumns} 
              dataSource={alerts} 
              rowKey="_id" 
            />
          </Card>
        );
      default:
        return <div>Select a menu item</div>;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} width={250}>
        <div className="demo-logo-vertical" style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'white',
          fontSize: 20,
          fontWeight: 'bold'
        }}>
          {collapsed ? 'IZ' : 'Invizio'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['dashboard']}
          onClick={({ key }) => setSelectedMenu(key)}
          items={[
            {
              key: 'dashboard',
              icon: <DashboardOutlined />,
              label: 'Dashboard',
            },
            {
              key: 'inventory',
              icon: <ShoppingCartOutlined />,
              label: 'Inventory',
            },
            {
              key: 'analytics',
              icon: <LineChartOutlined />,
              label: 'Analytics',
            },
            {
              key: 'forecasting',
              icon: <StockOutlined />,
              label: 'Demand Forecasting',
            },
            {
              key: 'reports',
              icon: <PieChartOutlined />,
              label: 'Reports',
            },
            {
              key: 'alerts',
              icon: <AlertOutlined />,
              label: (
                <span>
                  Alerts <Badge count={alerts.length} style={{ marginLeft: 10 }} />
                </span>
              ),
            },
            {
              key: 'settings',
              icon: <SettingOutlined />,
              label: 'Settings',
            },
          ]}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
              }}
            />
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              style={{ marginRight: 24 }}
            >
              {!collapsed && 'Logout'}
            </Button>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: 8,
          }}
        >
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminDashboard;