"use client";

import React from 'react';
import { FiExternalLink } from 'react-icons/fi';
import { motion } from 'framer-motion';

const TutorialPage = () => {
  const resources = [
    {
      title: 'Todos los PROTOCOLOS DE RED explicados fácil',
      url: 'https://www.youtube.com/watch?v=-NToJj1y9mc&pp=ygUFcmVkZXM%3D',
      description: 'Explicación detallada de los protocolos de red más importantes.'
    },
    {
      title: 'Qué haría si tuviera que empezar de nuevo',
      url: 'https://www.youtube.com/watch?v=8tW-Yr224-k&pp=ygUIc295ZGFsdG8%3D',
      description: 'Consejos valiosos para comenzar en el mundo de la programación.'
    },
    {
      title: 'JAVASCRIPT desde cero',
      url: 'https://www.youtube.com/watch?v=z95mZVUcJ-E&pp=ygUIc295ZGFsdG_SBwkJwQkBhyohjO8%3D',
      description: 'Aprende JavaScript desde lo más básico hasta conceptos avanzados.'
    },
    {
      title: 'SQL para principiantes',
      url: 'https://www.youtube.com/watch?v=DFg1V-rO6Pg',
      description: 'Introducción completa a bases de datos SQL.'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Tutorial de la Plataforma</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="aspect-w-16 aspect-h-9">
            <video 
              className="w-full h-auto" 
              controls
              poster="/tutorial-thumbnail.jpg"
            >
              <source src="/tutorial.mp4" type="video/mp4" />
              Tu navegador no soporta el elemento de video.
            </video>
          </div>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Guía de Uso Completa</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Aprende a navegar y aprovechar al máximo todas las funcionalidades de nuestra plataforma educativa.
            </p>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recursos Adicionales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {resources.map((resource, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
                className="group"
              >
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-full p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                      {resource.title}
                    </h3>
                    <FiExternalLink className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    {resource.description}
                  </p>
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TutorialPage;