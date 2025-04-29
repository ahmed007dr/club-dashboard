import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BASE_URL from '../../config/api';

const ExpenseCategories = () => {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get token from localStorage or any other storage you're using
    const token = localStorage.getItem('token'); // Adjust this as needed

    // If there's no token, handle the error accordingly
    if (!token) {
      setError('Authentication token is missing');
      return;
    }

    // Fetch data when the component mounts
    axios
      .get(`${BASE_URL}/api/finance/api/expense-categories/`, {
        headers: {
          'accept': 'application/json',
          'Authorization': token,  // Directly add token here (without 'Bearer' prefix)
        },
      })
      .then((response) => {
        console.log("Fetched categories:", response.data);
        setCategories(response.data); // Set response data to categories state
      })
      .catch((err) => {
        setError('Error fetching data'); // Handle error
        console.error(err);
      });
  }, []); // Empty dependency array to run the effect only once

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <h1>Expense Categories</h1>
      <ul>
        {categories.length > 0 ? (
          categories.map((category) => (
            <li key={category.id}>{category.name}</li> 
          ))
        ) : (
          <li>No categories available</li>
        )}
      </ul>
    </div>
  );
};

export default ExpenseCategories;
