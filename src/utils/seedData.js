const faker = require('faker');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const logger = require('./logger');

// Import models
const User = require('../modules/users/models/userModel');
const Lawyer = require('../modules/users/models/lawyerModel');
const Category = require('../modules/services/models/categoryModel');
const Service = require('../modules/services/models/serviceModel');
const Booking = require('../modules/bookings/models/bookingModel');
const Payment = require('../modules/payments/models/paymentModel');
const Review = require('../modules/services/models/reviewModel');
const Cart = require('../modules/users/models/cartModel');
const Wishlist = require('../modules/users/models/wishlistModel');
const Notification = require('../modules/notifications/models/notification');

// Number of each entity to create
const NUM_USERS = 20;
const NUM_LAWYERS = 10;
const NUM_CATEGORIES = 5;
const NUM_SERVICES = 15;
const NUM_BOOKINGS = 30;
const NUM_REVIEWS = 25;

/**
 * Generate random users
 */
const generateUsers = async (count = NUM_USERS) => {
  logger.info(`Generating ${count} users`);
  
  const users = [];
  const password = await bcrypt.hash('password123', 10);

  // Create one admin user
  users.push({
    name: 'Admin User',
    email: 'admin@pocketlegal.com',
    password,
    phone: '1234567890',
    role: 'admin',
    address: faker.address.streetAddress(),
    profilePicture: `https://randomuser.me/api/portraits/men/1.jpg`,
    isVerified: true
  });

  // Create random users
  for (let i = 0; i < count - 1; i++) {
    const gender = i % 2 === 0 ? 'men' : 'women';
    const user = {
      name: faker.name.findName(),
      email: faker.internet.email().toLowerCase(),
      password,
      phone: faker.phone.phoneNumber('##########'),
      role: 'customer',
      address: faker.address.streetAddress(),
      profilePicture: `https://randomuser.me/api/portraits/thumb/${gender}/${i + 1}.jpg`,
      isVerified: true
    };
    users.push(user);
  }

  return await User.insertMany(users);
};

/**
 * Generate random lawyers
 */
const generateLawyers = async (count = NUM_LAWYERS) => {
  logger.info(`Generating ${count} lawyers`);
  
  const users = [];
  const lawyers = [];
  const password = await bcrypt.hash('password123', 10);
  
  // Create lawyer users first
  for (let i = 0; i < count; i++) {
    const gender = i % 2 === 0 ? 'men' : 'women';
    const user = {
      _id: new mongoose.Types.ObjectId(),
      name: faker.name.findName(),
      email: faker.internet.email().toLowerCase(),
      password,
      phone: faker.phone.phoneNumber('##########'),
      role: 'lawyer',
      address: faker.address.streetAddress(),
      profilePicture: `https://randomuser.me/api/portraits/${gender}/${i + 10}.jpg`,
      isVerified: true
    };
    users.push(user);
    
    // Generate lawyer profile for each user
    const lawyer = {
      userId: user._id,
      bio: faker.lorem.paragraph(),
      areasOfExpertise: [
        faker.random.arrayElement(['Family Law', 'Corporate Law', 'Criminal Law', 'Real Estate', 'Immigration', 'Tax Law', 'Intellectual Property']),
        faker.random.arrayElement(['Family Law', 'Corporate Law', 'Criminal Law', 'Real Estate', 'Immigration', 'Tax Law', 'Intellectual Property'])
      ],
      hourlyRate: faker.datatype.number({ min: 100, max: 500, precision: 5 }),
      rating: faker.datatype.number({ min: 3, max: 5, precision: 0.1 }),
      numberOfRatings: faker.datatype.number({ min: 0, max: 50 }),
      education: [
        {
          institution: faker.company.companyName() + ' University',
          degree: 'J.D.',
          fieldOfStudy: 'Law',
          from: new Date(faker.date.past(10)),
          to: new Date(faker.date.past(5))
        }
      ],
      experience: [
        {
          title: 'Associate',
          company: faker.company.companyName() + ' Law Firm',
          location: faker.address.city(),
          from: new Date(faker.date.past(5)),
          to: new Date()
        }
      ],
      availability: {
        monday: { available: true, slots: ['9:00-12:00', '13:00-17:00'] },
        tuesday: { available: true, slots: ['9:00-12:00', '13:00-17:00'] },
        wednesday: { available: true, slots: ['9:00-12:00', '13:00-17:00'] },
        thursday: { available: true, slots: ['9:00-12:00', '13:00-17:00'] },
        friday: { available: true, slots: ['9:00-12:00', '13:00-17:00'] },
        saturday: { available: false, slots: [] },
        sunday: { available: false, slots: [] }
      }
    };
    lawyers.push(lawyer);
  }
  
  // Insert all lawyer users
  await User.insertMany(users);
  
  // Insert lawyer profiles
  return await Lawyer.insertMany(lawyers);
};

/**
 * Generate categories
 */
const generateCategories = async (count = NUM_CATEGORIES) => {
  logger.info(`Generating ${count} categories`);
  
  const categories = [
    {
      name: 'Family Law',
      description: 'Legal services related to family matters including divorce, custody, and adoption.',
      icon: 'family',
      order: 1
    },
    {
      name: 'Corporate Law',
      description: 'Legal services for businesses including formation, compliance, and contracts.',
      icon: 'business',
      order: 2
    },
    {
      name: 'Criminal Law',
      description: 'Legal services related to criminal charges and defense.',
      icon: 'gavel',
      order: 3
    },
    {
      name: 'Real Estate Law',
      description: 'Legal services related to property, buying, selling, and disputes.',
      icon: 'home',
      order: 4
    },
    {
      name: 'Immigration Law',
      description: 'Legal services related to immigration, visas, and citizenship.',
      icon: 'globe',
      order: 5
    }
  ];
  
  return await Category.insertMany(categories);
};

/**
 * Generate services
 */
const generateServices = async (categories, lawyers, count = NUM_SERVICES) => {
  logger.info(`Generating ${count} services`);
  
  const services = [];
  
  for (let i = 0; i < count; i++) {
    // Randomly select 1-3 lawyers for this service
    const serviceLawyers = [];
    const lawyerCount = faker.datatype.number({ min: 1, max: 3 });
    const shuffledLawyers = [...lawyers].sort(() => 0.5 - Math.random());
    
    for (let j = 0; j < lawyerCount && j < shuffledLawyers.length; j++) {
      serviceLawyers.push(shuffledLawyers[j]._id);
    }
    
    // Select a random category
    const category = categories[faker.datatype.number({ min: 0, max: categories.length - 1 })];
    
    const service = {
      name: faker.company.catchPhrase(),
      description: faker.lorem.paragraphs(3),
      shortDescription: faker.lorem.sentence(),
      categoryId: category._id,
      basePrice: faker.datatype.number({ min: 100, max: 1000, precision: 50 }),
      duration: faker.datatype.number({ min: 30, max: 120, precision: 15 }),
      image: `https://picsum.photos/id/${i + 10}/500/300`,
      isActive: true,
      requiresConsultation: faker.datatype.boolean(),
      lawyers: serviceLawyers,
      popularityScore: faker.datatype.number({ min: 10, max: 1000 }),
      rating: faker.datatype.number({ min: 3, max: 5, precision: 0.1 }),
      numberOfRatings: faker.datatype.number({ min: 0, max: 50 }),
      tags: [
        faker.random.word(),
        faker.random.word(),
        faker.random.word()
      ],
      benefits: [
        faker.lorem.sentence(),
        faker.lorem.sentence(),
        faker.lorem.sentence()
      ],
      requirements: [
        faker.lorem.sentence(),
        faker.lorem.sentence()
      ],
      faq: [
        {
          question: faker.lorem.sentence() + '?',
          answer: faker.lorem.paragraph()
        },
        {
          question: faker.lorem.sentence() + '?',
          answer: faker.lorem.paragraph()
        }
      ],
      featured: i < 5 // Make first 5 services featured
    };
    
    services.push(service);
  }
  
  return await Service.insertMany(services);
};

/**
 * Generate bookings
 */
const generateBookings = async (users, lawyers, services, count = NUM_BOOKINGS) => {
  logger.info(`Generating ${count} bookings`);
  
  const bookings = [];
  const statuses = ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'];
  const paymentStatuses = ['pending', 'paid', 'refunded', 'failed'];
  
  for (let i = 0; i < count; i++) {
    // Select random customer (from regular users)
    const customer = users[faker.datatype.number({ min: 0, max: users.length - 1 })];
    
    // Select random service
    const service = services[faker.datatype.number({ min: 0, max: services.length - 1 })];
    
    // Select a lawyer from the service's lawyers
    let lawyerId;
    if (service.lawyers && service.lawyers.length > 0) {
      lawyerId = service.lawyers[faker.datatype.number({ min: 0, max: service.lawyers.length - 1 })];
    } else {
      lawyerId = lawyers[faker.datatype.number({ min: 0, max: lawyers.length - 1 })]._id;
    }
    
    // Generate booking date (past or future)
    const isPastBooking = i < count / 2;
    let bookingDate;
    
    if (isPastBooking) {
      bookingDate = faker.date.past(1); // Past year
    } else {
      bookingDate = faker.date.future(1); // Next year
    }
    
    // Set start time and end time
    const startTime = new Date(bookingDate);
    startTime.setHours(faker.datatype.number({ min: 9, max: 16 }), 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1);
    
    // Set status based on whether it's a past or future booking
    let status;
    if (isPastBooking) {
      status = faker.random.arrayElement(['completed', 'cancelled', 'rejected']);
    } else {
      status = faker.random.arrayElement(['pending', 'confirmed']);
    }
    
    // Calculate total amount
    const lawyer = await Lawyer.findById(lawyerId);
    const totalAmount = service.basePrice + (lawyer ? lawyer.hourlyRate : 0);
    
    const booking = {
      customerId: customer._id,
      lawyerId,
      serviceId: service._id,
      bookingDate,
      startTime,
      endTime,
      status,
      totalAmount,
      paymentStatus: status === 'completed' ? 'paid' : faker.random.arrayElement(paymentStatuses),
      notes: faker.lorem.sentences(2),
      customerNotes: faker.lorem.sentence(),
      lawyerNotes: status !== 'pending' ? faker.lorem.sentence() : '',
      isReviewed: status === 'completed' && i % 3 === 0, // Every 3rd completed booking has a review
    };
    
    // Add cancellation info if cancelled
    if (status === 'cancelled' || status === 'rejected') {
      booking.cancelledBy = status === 'cancelled' ? 'customer' : 'lawyer';
      booking.cancelledAt = faker.date.recent();
    }
    
    bookings.push(booking);
  }
  
  return await Booking.insertMany(bookings);
};

/**
 * Generate payments
 */
const generatePayments = async (bookings) => {
  logger.info(`Generating payments for ${bookings.length} bookings`);
  
  const payments = [];
  const paymentMethods = ['credit_card', 'debit_card', 'paypal', 'bank_transfer'];
  
  for (const booking of bookings) {
    // Only create payments for bookings with 'paid' or 'refunded' status
    if (booking.paymentStatus === 'paid' || booking.paymentStatus === 'refunded') {
      const payment = {
        customerId: booking.customerId,
        lawyerId: booking.lawyerId,
        bookingId: booking._id,
        amount: booking.totalAmount,
        paymentMethod: faker.random.arrayElement(paymentMethods),
        status: booking.paymentStatus === 'refunded' ? 'refunded' : 'success',
        transactionId: `TXN-${Date.now()}-${faker.datatype.number({ min: 100000, max: 999999 })}`,
        paidAt: new Date(faker.date.recent())
      };
      
      // Add refund info if refunded
      if (booking.paymentStatus === 'refunded') {
        payment.refunded = true;
        payment.refundedAt = new Date(faker.date.recent());
        payment.refundAmount = booking.totalAmount;
        payment.refundReason = faker.lorem.sentence();
      }
      
      payments.push(payment);
      
      // Update booking with payment ID after creating payments
      await Booking.findByIdAndUpdate(booking._id, { paymentId: payment._id });
    }
  }
  
  return await Payment.insertMany(payments);
};

/**
 * Generate reviews
 */
const generateReviews = async (bookings, count = NUM_REVIEWS) => {
  logger.info(`Generating ${count} reviews`);
  
  // Filter bookings that are completed and have isReviewed set to true
  const completedBookings = bookings.filter(booking => 
    booking.status === 'completed' && booking.isReviewed
  );
  
  const reviews = [];
  
  // Use as many completed bookings as we can, up to the count
  const reviewCount = Math.min(completedBookings.length, count);
  
  for (let i = 0; i < reviewCount; i++) {
    const booking = completedBookings[i];
    
    const review = {
      userId: booking.customerId,
      bookingId: booking._id,
      serviceId: booking.serviceId,
      lawyerId: booking.lawyerId,
      rating: faker.datatype.number({ min: 3, max: 5 }),
      comment: faker.lorem.paragraph(),
      isPublished: true,
      createdAt: new Date(faker.date.recent())
    };
    
    reviews.push(review);
    
    // Make sure we update the booking with the review ID
    await Booking.findByIdAndUpdate(booking._id, { 
      isReviewed: true,
      reviewId: review._id 
    });
  }
  
  const createdReviews = await Review.insertMany(reviews);
  
  // Update service and lawyer ratings based on reviews
  for (const review of createdReviews) {
    // Update service rating
    const serviceReviews = createdReviews.filter(r => 
      r.serviceId && r.serviceId.toString() === review.serviceId.toString()
    );
    
    if (serviceReviews.length > 0) {
      const totalRating = serviceReviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalRating / serviceReviews.length;
      
      await Service.findByIdAndUpdate(review.serviceId, {
        rating: avgRating,
        numberOfRatings: serviceReviews.length
      });
    }
    
    // Update lawyer rating
    const lawyerReviews = createdReviews.filter(r => 
      r.lawyerId && r.lawyerId.toString() === review.lawyerId.toString()
    );
    
    if (lawyerReviews.length > 0) {
      const totalRating = lawyerReviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalRating / lawyerReviews.length;
      
      await Lawyer.findByIdAndUpdate(review.lawyerId, {
        rating: avgRating,
        numberOfRatings: lawyerReviews.length
      });
    }
  }
  
  return createdReviews;
};

/**
 * Generate notifications
 */
const generateNotifications = async (users, bookings) => {
  logger.info(`Generating notifications`);
  
  const notifications = [];
  const types = ['booking', 'payment', 'system', 'review'];
  
  // Create 3-5 notifications for each user
  for (const user of users) {
    const notificationCount = faker.datatype.number({ min: 3, max: 5 });
    
    for (let i = 0; i < notificationCount; i++) {
      const type = faker.random.arrayElement(types);
      let relatedId, relatedModel;
      
      // For booking and payment notifications, link to an actual booking
      if (type === 'booking' || type === 'payment') {
        const userBookings = bookings.filter(booking => 
          booking.customerId.toString() === user._id.toString() || 
          (booking.lawyerId && booking.lawyerId.toString() === user._id.toString())
        );
        
        if (userBookings.length > 0) {
          const booking = userBookings[faker.datatype.number({ min: 0, max: userBookings.length - 1 })];
          relatedId = booking._id;
          relatedModel = 'Booking';
        }
      }
      
      const notification = {
        userId: user._id,
        title: faker.lorem.sentence(3),
        message: faker.lorem.sentence(),
        read: faker.datatype.boolean(),
        type,
        relatedId,
        relatedModel,
        priority: faker.random.arrayElement(['low', 'medium', 'high']),
        actionUrl: relatedId ? `/bookings/${relatedId}` : '/dashboard',
        icon: type === 'booking' ? 'calendar' : type === 'payment' ? 'money' : type === 'review' ? 'star' : 'bell',
        createdAt: faker.date.recent(30)
      };
      
      if (notification.read) {
        notification.readAt = new Date(notification.createdAt);
        notification.readAt.setHours(notification.readAt.getHours() + 2);
      }
      
      notifications.push(notification);
    }
  }
  
  return await Notification.insertMany(notifications);
};

/**
 * Generate cart items
 */
const generateCartItems = async (users, services, lawyers) => {
  logger.info(`Generating cart items`);
  
  const cartItems = [];
  
  // Create cart items for a subset of users
  const cartUsers = users.slice(0, 5);
  
  for (const user of cartUsers) {
    const itemCount = faker.datatype.number({ min: 1, max: 3 });
    
    for (let i = 0; i < itemCount; i++) {
      // Select random service
      const service = services[faker.datatype.number({ min: 0, max: services.length - 1 })];
      
      // Select a lawyer from the service's lawyers or any lawyer
      let lawyerId;
      if (service.lawyers && service.lawyers.length > 0) {
        lawyerId = service.lawyers[faker.datatype.number({ min: 0, max: service.lawyers.length - 1 })];
      } else {
        lawyerId = lawyers[faker.datatype.number({ min: 0, max: lawyers.length - 1 })]._id;
      }
      
      const cartItem = {
        userId: user._id,
        serviceId: service._id,
        lawyerId,
        quantity: faker.datatype.number({ min: 1, max: 2 }),
        notes: faker.lorem.sentence(),
        preferredDate: new Date(faker.date.future(1))
      };
      
      cartItems.push(cartItem);
    }
  }
  
  return await Cart.insertMany(cartItems);
};

/**
 * Generate wishlist items
 */
const generateWishlistItems = async (users, services, lawyers) => {
  logger.info(`Generating wishlist items`);
  
  const wishlistItems = [];
  
  // Create wishlist items for a subset of users
  const wishlistUsers = users.slice(5, 10);
  
  for (const user of wishlistUsers) {
    const itemCount = faker.datatype.number({ min: 1, max: 4 });
    
    for (let i = 0; i < itemCount; i++) {
      let item;
      
      // 70% chance to add a service, 30% to add a lawyer
      if (faker.datatype.number(10) <= 7) {
        // Add a service
        const service = services[faker.datatype.number({ min: 0, max: services.length - 1 })];
        
        item = {
          userId: user._id,
          serviceId: service._id,
          notes: faker.lorem.sentence()
        };
      } else {
        // Add a lawyer
        const lawyer = lawyers[faker.datatype.number({ min: 0, max: lawyers.length - 1 })];
        
        item = {
          userId: user._id,
          lawyerId: lawyer._id,
          notes: faker.lorem.sentence()
        };
      }
      
      wishlistItems.push(item);
    }
  }
  
  return await Wishlist.insertMany(wishlistItems);
};

/**
 * Clear all collections
 */
const clearDatabase = async () => {
  logger.info('Clearing database');
  
  await User.deleteMany({});
  await Lawyer.deleteMany({});
  await Category.deleteMany({});
  await Service.deleteMany({});
  await Booking.deleteMany({});
  await Payment.deleteMany({});
  await Review.deleteMany({});
  await Cart.deleteMany({});
  await Wishlist.deleteMany({});
  await Notification.deleteMany({});
  
  logger.info('Database cleared');
};

/**
 * Main seed function
 */
const seedDatabase = async (clear = true) => {
  try {
    logger.info('Starting database seeding');
    
    if (clear) {
      await clearDatabase();
    }
    
    // Generate data in order of dependencies
    const users = await generateUsers();
    const lawyers = await generateLawyers();
    const categories = await generateCategories();
    const services = await generateServices(categories, lawyers);
    const bookings = await generateBookings(users, lawyers, services);
    const payments = await generatePayments(bookings);
    const reviews = await generateReviews(bookings);
    const cartItems = await generateCartItems(users, services, lawyers);
    const wishlistItems = await generateWishlistItems(users, services, lawyers);
    const notifications = await generateNotifications(users, bookings);
    
    logger.info('Database seeding completed successfully');
    
    return {
      users: users.length,
      lawyers: lawyers.length,
      categories: categories.length,
      services: services.length,
      bookings: bookings.length,
      payments: payments.length,
      reviews: reviews.length,
      cartItems: cartItems.length,
      wishlistItems: wishlistItems.length,
      notifications: notifications.length
    };
  } catch (error) {
    logger.error('Error seeding database:', error);
    throw error;
  }
};

module.exports = {
  seedDatabase,
  clearDatabase
}; 