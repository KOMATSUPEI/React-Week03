import { useEffect,useState,useRef } from "react";
import axios from "axios";
import { Modal } from 'bootstrap';

const BASE_URL = import.meta.env.VITE_BASE_URL;
const API_PATH = import.meta.env.VITE_API_PATH;

const defaultModalState = {
  id:"",
  imageUrl: "",
  title: "",
  category: "",
  unit: "",
  origin_price: "",
  price: "",
  description: "",
  content: "",
  is_enabled: 0,
  imagesUrl: [""],
};

function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [products, setProducts] = useState([]);
  const [account, setAccount] = useState({
    username: "example@test.com",
    password: "example",
  });

  const handleInputChange = (e) => {
    const { value, name } = e.target;

    setAccount({
      ...account,
      [name]: value,
    });
  };
// 取得產品資料
  const getProducts = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/v2/api/${API_PATH}/admin/products`
      );
      setProducts(res.data.products);
    } catch (error) {
      alert("取得產品失敗");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${BASE_URL}/v2/admin/signin`, account);

      const { token, expired } = res.data;
      document.cookie = `hexToken=${token}; expires=${new Date(expired)}`;

      axios.defaults.headers.common["Authorization"] = token;

      getProducts();

      setIsAuth(true);
    } catch (error) {
      alert("登入失敗");
    }
  };
// 檢查使用者登入狀態
  const checkUserLogin = async () => {
    try {
      await axios.post(`${BASE_URL}/v2/api/user/check`);
      getProducts();
      setIsAuth(true);
    } catch (error) {
      console.error(error);
    }
  };
// useEffect 登入後存取token
  useEffect(()=>{
    const token = document.cookie.replace(
      /(?:(?:^|.*;\s*)hexToken\s*\=\s*([^;]*).*$)|^.*$/,
      "$1",
    );

    axios.defaults.headers.common['Authorization'] = token;

    checkUserLogin();
  },[])

// 透過 useRef 取得 DOM
  const productModalRef=useRef(null);
  const delProductModalRef=useRef(null);
  const [modalMode,setModalMode]=useState(null);// 判斷當前動作是新增產品還是編輯產品

// 建立 Modal 實例（頁面渲染後才取得 DOM）
  useEffect(()=>{
    new Modal(productModalRef.current,{backdrop:false});//點擊背景不關閉
    // console.log(Modal.getInstance(productModalRef.current));
  },[])

// 建立 刪除Modal 實例
  useEffect(()=>{
    new Modal(delProductModalRef.current,{backdrop:false});
  },[])

// 開啟 Modal
  const handleOpenProductModal=(mode,product)=>{

    //點擊編輯or建立新的產品，傳入參數
    setModalMode(mode);

    // 判斷是新增還是編輯
    switch(mode){
      case "create":
            setTempProduct(defaultModalState);
            break;
      case "edit":
            setTempProduct({
              ...product,
              id: product.id || "",
              imageUrl: product.imageUrl || "",
              title: product.title || "",
              category: product.category || "",
              unit: product.unit || "",
              origin_price: product.origin_price || "",
              price: product.price || "",
              description: product.description || "",
              content: product.content || "",
              is_enabled: product.is_enabled || false,
              imagesUrl: product.imagesUrl || []
            });
            break;
        default:
          break;
    }

    const modalInstance=Modal.getInstance(productModalRef.current);
    modalInstance.show();
  };

// 關閉 Modal
const handleCloseProductModal=()=>{
  const modalInstance=Modal.getInstance(productModalRef.current);
  modalInstance.hide();
};
// 開啟 刪除Modal
const handleOpenDelProductModal=(product)=>{
  setTempProduct(product);
  const modalInstance=Modal.getInstance(delProductModalRef.current);
  modalInstance.show();
};
// 關閉 刪除Modal
const handleCloseDelProductModal=()=>{
  const modalInstance=Modal.getInstance(delProductModalRef.current);
  modalInstance.hide();
};

// Modal輸入值＆事件監聽
const [tempProduct, setTempProduct] = useState(defaultModalState);//預設產品資訊

const handleModalInputChange=(e)=>{
  const {value,name,checked,type}=e.target;

  setTempProduct({
    ...tempProduct,
    [name]:type === "checkbox" ? checked : value
  })//針對checkbox做判斷
};

// 副圖處理
const handleImageChange=(e,index)=>{
  const {value}=e.target;
  const newImages=[...tempProduct.imagesUrl];
  
  newImages[index]=value;
  setTempProduct({
    ...tempProduct,
    imagesUrl:newImages
  })
}

// 新增&刪除副圖
const handleAddImage=()=>{
  const newImages=[...tempProduct.imagesUrl,""];
  
  setTempProduct({
    ...tempProduct,
    imagesUrl:newImages
  })
}

const handleRemoveImage=()=>{
  const newImages=[...tempProduct.imagesUrl];
  
  newImages.pop();//移除最後一個欄位
  setTempProduct({
    ...tempProduct,
    imagesUrl:newImages
  })
}

//新增產品
const createProduct=async()=>{
  try{
    await axios.post(`${BASE_URL}/v2/api/${API_PATH}/admin/product`,{
      data:{
        ...tempProduct,
        origin_price:Number(tempProduct.origin_price),
        price:Number(tempProduct.price),
        is_enabled:tempProduct.is_enabled ? 1 : 0
      }
    });
  }catch(error){
    alert("產品新增失敗！");
  } 
}

//編輯產品
const updateProduct=async()=>{
  try{
    await axios.put(`${BASE_URL}/v2/api/${API_PATH}/admin/product/${tempProduct.id}`,{
      data:{
        ...tempProduct,
        origin_price:Number(tempProduct.origin_price),
        price:Number(tempProduct.price),
        is_enabled:tempProduct.is_enabled ? 1 : 0
      }
    });
  }catch(error){
    alert("產品編輯失敗！");
  } 
}

//刪除Modal 刪除產品
const deleteProduct=async()=>{
  try{
    await axios.delete(`${BASE_URL}/v2/api/${API_PATH}/admin/product/${tempProduct.id}`);
  }catch(error){
    alert("產品編輯失敗！");
  } 
}

//按下 確認 後新增產品
const handleUpdateProduct=async()=>{
  const apiCall = modalMode === "create" ? createProduct : updateProduct;

  try{
    await apiCall();
    getProducts();//重新渲染新產品畫面
    handleCloseProductModal();//關閉Modal
  }catch(error){
    alert("產品更新失敗！");
  }
}

//按下刪除Modal 刪除後刪除產品
const handleDeleteProduct=async()=>{

  try{
    await deleteProduct();
    getProducts();//重新渲染新產品畫面
    handleCloseDelProductModal();//關閉Modal
  }catch(error){
    alert("產品刪除失敗！");
  }
}

  return (
    <>
      {/* 產品列表 */}
      {isAuth ? (
        <div className="container py-5">
          <div className="row">
            <div className="col">
              <div className="d-flex justify-content-between">
              <h1>產品列表</h1>
              <button type="button" className="btn btn-primary" onClick={()=>handleOpenProductModal("create")}>建立新的產品</button>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">產品名稱</th>
                    <th scope="col">原價</th>
                    <th scope="col">售價</th>
                    <th scope="col">是否啟用</th>
                    <th scope="col"></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <th scope="row">{product.title}</th>
                      <td>{product.origin_price}</td>
                      <td>{product.price}</td>
                      <td>{product.is_enabled ? (<span className="text-success">啟用</span>) : (<span>未啟用</span>)}</td>
                      <td>
                      <div className="btn-group">
                        <button type="button" className="btn btn-outline-primary btn-sm" onClick={()=>handleOpenProductModal("edit",product)}>編輯</button>
                        <button type="button" className="btn btn-outline-danger btn-sm" onClick={()=>handleOpenDelProductModal(product)}>刪除</button>
                      </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="d-flex flex-column justify-content-center align-items-center vh-100">
          <h1 className="mb-5">請先登入</h1>
          <form onSubmit={handleLogin} className="d-flex flex-column gap-3">
            <div className="form-floating mb-3">
              <input
                name="username"
                value={account.username}
                onChange={handleInputChange}
                type="email"
                className="form-control"
                id="username"
                placeholder="name@example.com"
              />
              <label htmlFor="username">Email address</label>
            </div>
            <div className="form-floating">
              <input
                name="password"
                value={account.password}
                onChange={handleInputChange}
                type="password"
                className="form-control"
                id="password"
                placeholder="Password"
              />
              <label htmlFor="password">Password</label>
            </div>
            <button className="btn btn-primary">登入</button>
          </form>
          <p className="mt-5 mb-3 text-muted">&copy; 2024~∞ - 六角學院</p>
        </div>
      )}

      {/* ProductModal */}
      {/* 綁定 useRef 取得 DOM */}
      <div ref={productModalRef} id="productModal" className="modal" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        <div className="modal-dialog modal-dialog-centered modal-xl">
          <div className="modal-content border-0 shadow">
            <div className="modal-header border-bottom">
              {/* 判斷當前動作是新增產品還是編輯產品 */}
              <h5 className="modal-title fs-4">{modalMode === "create" ? "新增產品" : "編輯產品"}</h5>
              {/* Ｘ取消 */}
              <button type="button" className="btn-close" aria-label="Close" onClick={handleCloseProductModal}></button>
            </div>

            <div className="modal-body p-4">
              <div className="row g-4">
                <div className="col-md-4">
                  <div className="mb-4">
                    <label htmlFor="primary-image" className="form-label">
                      主圖
                    </label>
                    <div className="input-group">
                      <input
                        value={tempProduct.imageUrl}//綁定tempProduct
                        onChange={handleModalInputChange}
                        name="imageUrl"
                        type="text"
                        id="primary-image"
                        className="form-control"
                        placeholder="請輸入圖片連結"
                      />
                    </div>
                    <img
                      src={tempProduct.imageUrl}//綁定tempProduct
                      alt={tempProduct.title}
                      className="img-fluid"
                    />
                  </div>

                  {/* 副圖 */}
                  <div className="border border-2 border-dashed rounded-3 p-3">
                    {tempProduct.imagesUrl?.map((image, index) => (
                      <div key={index} className="mb-2">
                        <label
                          htmlFor={`imagesUrl-${index + 1}`}
                          className="form-label"
                        >
                          副圖 {index + 1}
                        </label>
                        <input
                          value={image}
                          onChange={(e)=>handleImageChange(e,index)}
                          id={`imagesUrl-${index + 1}`}
                          type="text"
                          placeholder={`圖片網址 ${index + 1}`}
                          className="form-control mb-2"
                        />
                        {image && (
                          <img
                            src={image}
                            alt={`副圖 ${index + 1}`}
                            className="img-fluid mb-2"
                          />
                        )}
                      </div>
                    ))}
                    {/* 副圖新增＆取消按鈕 */}
                    <div className="btn-group w-100">
                      {(tempProduct.imagesUrl.length<5) && (tempProduct.imagesUrl[tempProduct.imagesUrl.length-1]!=="") && (<button onClick={handleAddImage} className="btn btn-outline-primary btn-sm w-100">新增圖片</button>)}
                      {(tempProduct.imagesUrl.length>1) && (<button onClick={handleRemoveImage} className="btn btn-outline-danger btn-sm w-100">取消圖片</button>)}
                    </div>
                  </div>
                </div>

                <div className="col-md-8">
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">
                      標題
                    </label>
                    <input
                      value={tempProduct.title}//綁定tempProduct
                      onChange={handleModalInputChange}
                      name="title"
                      id="title"
                      type="text"
                      className="form-control"
                      placeholder="請輸入標題"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="category" className="form-label">
                      分類
                    </label>
                    <input
                      value={tempProduct.category}//綁定tempProduct
                      onChange={handleModalInputChange}
                      name="category"
                      id="category"
                      type="text"
                      className="form-control"
                      placeholder="請輸入分類"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="unit" className="form-label">
                      單位
                    </label>
                    <input
                      value={tempProduct.unit}//綁定tempProduct
                      onChange={handleModalInputChange}
                      name="unit"
                      id="unit"
                      type="text"
                      className="form-control"
                      placeholder="請輸入單位"
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label htmlFor="origin_price" className="form-label">
                        原價
                      </label>
                      <input
                        value={tempProduct.origin_price}//綁定tempProduct
                        onChange={handleModalInputChange}
                        name="origin_price"
                        id="origin_price"
                        type="number"
                        className="form-control"
                        placeholder="請輸入原價"
                      />
                    </div>
                    <div className="col-6">
                      <label htmlFor="price" className="form-label">
                        售價
                      </label>
                      <input
                        value={tempProduct.price}//綁定tempProduct
                        onChange={handleModalInputChange}
                        name="price"
                        id="price"
                        type="number"
                        className="form-control"
                        placeholder="請輸入售價"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">
                      產品描述
                    </label>
                    <textarea
                      value={tempProduct.description}//綁定tempProduct
                      onChange={handleModalInputChange}
                      name="description"
                      id="description"
                      className="form-control"
                      rows={4}
                      placeholder="請輸入產品描述"
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="content" className="form-label">
                      說明內容
                    </label>
                    <textarea
                      value={tempProduct.content}//綁定tempProduct
                      onChange={handleModalInputChange}
                      name="content"
                      id="content"
                      className="form-control"
                      rows={4}
                      placeholder="請輸入說明內容"
                    ></textarea>
                  </div>

                  <div className="form-check">
                    <input
                      checked={tempProduct.is_enabled}//綁定tempProduct
                      onChange={handleModalInputChange}
                      name="is_enabled"
                      type="checkbox"
                      className="form-check-input"
                      id="isEnabled"
                    />
                    <label className="form-check-label" htmlFor="isEnabled">
                      是否啟用
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer border-top bg-light">
              <button type="button" className="btn btn-secondary" onClick={handleCloseProductModal}>
                取消
              </button>
              <button type="button" className="btn btn-primary" onClick={handleUpdateProduct}>
                確認
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 刪除產品Modal  */}
      <div ref={delProductModalRef} className="modal fade" id="delProductModal" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5">刪除產品</h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={handleCloseDelProductModal}
              ></button>
            </div>
            <div className="modal-body">
              你是否要刪除 
              <span className="text-danger fw-bold">{tempProduct.title}</span>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCloseDelProductModal}
              >
                取消
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDeleteProduct}>
                刪除
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
