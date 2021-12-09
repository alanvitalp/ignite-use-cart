import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
     if (storagedCart) {
       return JSON.parse(storagedCart);
     }

    return [];
  });

  // const prevCartRef = useRef<Product[]>([]);

  // useEffect(() => {
  //   prevCartRef.current = cart;
  // })

  // const cartPreviousValue = prevCartRef.current ?? cart;

  // useEffect(() => {
  //   if (cartPreviousValue !== cart) {
  //     localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
  //   }
  // }, [cart, cartPreviousValue]);

  const addProduct = async (productId: number) => {
    try {
      const stock = await api.get(`stock/${productId}`)

      const updatedCart = [...cart]
      const productExists = updatedCart.find(product => product.id === productId)

      const stockAmount = stock.data.amount
      const currentAmount = productExists ? productExists.amount : 0;
      const amount = currentAmount + 1;

      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productExists) {
        productExists.amount = amount;
      } else {
        const product = await api.get(`/products/${productId}`);

        const newProduct = {
          ...product.data,
          amount: 1,
        }

        updatedCart.push(newProduct);
      }

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch (err) {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {    
      const product = cart.find(p => p.id === productId);

      if (product) {
        if (product.amount > 1) {
          setCart(cart.filter(p => p.id !== productId))
        }
      } else {
        throw Error();
      }

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const response = await api.get(`/stock/${productId}`)

      const product = cart.find(p => p.id === productId);

      if (product) {
        if (product.amount <= 0) {
          throw Error();
        } else {
          if (product.amount < response.data.amount) {
            product.amount = amount
            setCart([...cart])
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
          } else {
            toast.error('Quantidade solicitada fora de estoque');
            throw Error()
          }
        }
       }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}


