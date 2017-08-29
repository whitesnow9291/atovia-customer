import { CollectionObject } from "./collection-object.model";

export interface Booking extends CollectionObject {
    uniqueId: number;
    voucherId: number;
      tour: {
      id: string;
      supplierId: string;
      supplier?: {
        companyName: string;
        agentIdentity: {
          verified: boolean;
        };
        agentCertificate: {
          verified: boolean;
        };
        image: {
          id: string;
          url: string;
          name: string;
        };
      };
      name: string;
      departure: string;
      destination: string;
      featuredImage: {
        id: string;
        url: string;
        name: string;
      };
      noOfDays: number;
      noOfNights: number;
      totalMeals: number;
      cancellationPolicy: {
        id: string;
        url: string;
        name: string;
      };
      refundPolicy: {
        id: string;
        url: string;
        name: string;
      };
      hasGuide: boolean;
      hasFlight: boolean;
      tourType: string;
      tourPace: string;
      dateRangeId?: string;
      hasRated?: boolean;
      rating?: number;
    };
    user: {
      id: string;
      firstName: string;
      middleName: string;
      lastName: string;
      email: string;
      contact: string;
      image: {
        id: string;
        url: string;
        name: string;
      };
    };
    numOfTravellers: number;
    startDate: Date;
    endDate: Date;
    numOfAdults: number;
    numOfChild: number;
    currencyCode: string;
    pricePerAdult: number;
    pricePerChild: number;
    pricePerAdultDefault: number;
    pricePerChildDefault: number;
    travellers: [
      {
        firstName: string;
        middleName: string;
        lastName: string;
        email: string;
        contact: string;
        addressLine1: string;
        addressLine2: string;
        town: string;
        state: string;
        postCode: string;
        country: string;
        passport: {
          country: string;
          number: string;
        };
        specialRequest: string;
      }
    ];
    cardDetails: {
      name: string;
      cardNum: number;
      type: string;
      expiry: Date;
    };
    totalPrice: number;
    totalPriceDefault: number;
    bookingDate: Date;
    paymentDate: Date;
    active: boolean;
    confirmed: boolean;
    confirmedAt: Date;
    completed: boolean;
    cancelled: boolean;
    cancelledAt: Date;
    cancelledBy: string;
    cancellationReason: string;
    cancellationComments: string;
    denied: boolean;
    deniedReason: string;
    paymentInfo: {
      gateway: string;
      method: string;
      transactionId: string;
      gatewayTransId: string;
      status: string;
      saleId: string;
    };
    refunded: boolean;
    refundedAmount: number;
    refundInfo: {
      transactionId: string;
      gatewayTransId: string;
      processedAt: Date;
      processedBy: string;
    };
    deleted: boolean;
    createdAt: Date;
    modifiedAt: Date;
    reviewApprovalAt: Date;
    reviewMailCount: number;
}
