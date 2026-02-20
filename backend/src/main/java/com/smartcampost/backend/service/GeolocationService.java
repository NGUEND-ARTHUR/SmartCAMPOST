package com.smartcampost.backend.service;
import com.smartcampost.backend.dto.geo.*;

public interface GeolocationService {

    GeocodeResponse geocode(GeocodeRequest request);

    java.util.List<GeoSearchResult> search(GeoSearchRequest request);

    RouteEtaResponse calculateRouteEta(RouteEtaRequest request);
}