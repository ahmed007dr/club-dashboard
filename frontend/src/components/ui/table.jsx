// src/components/ui/table.jsx
import React from "react";

export function Table({ children, ...props }) {
  return <table className="w-full text-sm text-left" {...props}>{children}</table>;
}

export function TableHeader({ children, ...props }) {
  return <thead className="bg-gray-100" {...props}>{children}</thead>;
}

export function TableBody({ children, ...props }) {
  return <tbody {...props}>{children}</tbody>;
}

export function TableRow({ children, ...props }) {
  return <tr className="border-b" {...props}>{children}</tr>;
}

export function TableHead({ children, ...props }) {
  return <th className="px-4 py-2 font-medium text-gray-700" {...props}>{children}</th>;
}

export function TableCell({ children, ...props }) {
  return <td className="px-4 py-2" {...props}>{children}</td>;
}
