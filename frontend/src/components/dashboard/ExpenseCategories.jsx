import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ExpenseCategories = () => {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch data when the component mounts
    axios
      .get('http://127.0.0.1:8000/api/finance/api/expense-categories/', {
        headers: {
          'accept': 'application/json',
          'X-CSRFTOKEN': 'TaRpMCbb524KNQjJcfKnc9En7YuZaeAgc8yJMANJKpDLCG6KWgiRLoyp5zSnid4Q', // Replace with your actual token
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
  }, []);
   // Empty dependency array to run the effect only once

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
