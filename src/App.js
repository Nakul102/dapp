import React, { useState, useEffect } from 'react';
import { Types } from 'aptos';
import { useWallet } from '@manahippo/aptos-wallet-adapter';

const App = () => {
  const { account, signAndSubmitTransaction, connect, disconnect, isConnected } = useWallet();
  const [message, setMessage] = useState('');
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const moduleAddress = "0fdbdf302369bd9462436e9ffe1df18de618bb5b62946f4915a3fa15cb289d13";

  // Fetch the message stored on the blockchain
  const fetchMessage = async () => {
    if (!account?.address) return; // Ensure account address is available
    
    console.log('Fetching message...');
    try {
      const response = await fetch(
        `https://fullnode.testnet.aptoslabs.com/v1/view`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            function: `${moduleAddress}::message_store::get_message`,
            type_arguments: [],
            arguments: [account.address]
          }),
        }
      );
  
      if (!response.ok) {
        console.error('Error in response:', response.statusText);
        return;
      }
  
      const result = await response.json();
      if (result?.data?.message) {
        setCurrentMessage(result.data.message);
      } else {
        setCurrentMessage('No message set');
      }
    } catch (error) {
      console.error('Error fetching message:', error);
    }
  };

  useEffect(() => {
    // Ensure that account is available and fetch message
    if (account?.address) {
      console.log('Account:', account);
      fetchMessage();
    }
  }, [account]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account) return;

    try {
      setLoading(true);
      const payload = {
        type: "entry_function_payload",
        function: `${moduleAddress}::message_store::set_message`,
        type_arguments: [],
        arguments: [message]
      };

      const response = await signAndSubmitTransaction(payload);
      await response.wait();

      setMessage('');
      fetchMessage(); // Fetch the updated message after transaction
    } catch (error) {
      console.error('Error setting message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Aptos Message Store</h1>

      {!isConnected ? (
        <>
          <p className="text-red-500">Please connect your wallet</p>
          <button onClick={connect} className="bg-blue-500 text-white p-2 rounded mt-4">
            Connect Wallet
          </button>
        </>
      ) : (
        <>
          <div className="mb-4">
            <h2 className="font-semibold mb-2">Current Message:</h2>
            <p className="p-2 bg-gray-100 rounded">{currentMessage}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2">New Message:</label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Enter your message"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !message}
              className="w-full bg-blue-500 text-white p-2 rounded disabled:bg-gray-300"
            >
              {loading ? 'Processing...' : 'Set Message'}
            </button>
          </form>

          <button
            onClick={disconnect}
            className="bg-red-500 text-white p-2 rounded mt-4"
          >
            Disconnect Wallet
          </button>
        </>
      )}
    </div>
  );
};

export default App;
