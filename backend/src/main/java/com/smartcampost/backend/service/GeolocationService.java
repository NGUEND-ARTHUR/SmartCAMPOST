package com.smartcampost.backend.service;
import com.smartcampost.backend.dto.geo.*;

public interface GeolocationService {

    GeocodeResponse geocode(GeocodeRequest request);

    RouteEtaResponse calculateRouteEta(RouteEtaRequest request);
}